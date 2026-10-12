const xlsx = require('xlsx');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function parseDateStr(str) {
  if (!str) return null;
  if (typeof str === 'number') {
    const d = new Date((str - (25567 + 2)) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  let s = String(str).trim();
  s = s.replace(/\.030$/, '.30');
  s = s.replace(/\.031$/, '.31');
  s = s.replace(/[./]/g, '-');
  
  const parts = s.split('-');
  if (parts.length === 3) {
    let [y, m, d] = parts.map(p => parseInt(p, 10));
    if (m > 12 && d <= 12) {
      [m, d] = [d, m];
    }
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    if (!isNaN(dateObj.getTime())) return dateObj;
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function parseHeightToCm(val) {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    val = val.replace(/cm/i, '').trim();
  }
  const num = parseFloat(val);
  if (isNaN(num)) return null;

  if (num >= 100) {
    return parseFloat(num.toFixed(1));
  }

  const str = String(val).trim();
  const parts = str.split('.');
  const feet = parseInt(parts[0], 10);
  const inches = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  const totalInches = (feet * 12) + inches;
  const cm = totalInches * 2.54;
  return parseFloat(cm.toFixed(1));
}

function parseWeight(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : parseFloat(num.toFixed(2));
}

function cleanPhoneAndNotes(val) {
  if (val === undefined || val === null || val === '') return { phone: null, note: null };
  let str = String(val).trim().replace(/\s+/g, '');
  
  let note = null;
  if (str.includes('/')) {
    const parts = str.split('/');
    str = parts[0];
    note = `Alt Phone: ${parts[1]}`;
  }

  if (str.startsWith('+94')) {
    str = '0' + str.slice(3);
  } else if (str.length === 9 && !str.startsWith('0')) {
    str = '0' + str;
  }

  return { phone: str, note };
}

async function runImport() {
  const filePath = path.join(__dirname, '../assets/ACTIVE MEMBRS.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets['Sheet1'];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} member rows in Excel.`);

  const defaultPasswordHash = await bcrypt.hash('defaultPassword123', 10);
  console.log('Password hash generated.');

  const client = await pool.connect();
  console.log('Database connected.');

  try {
    // 1. Fetch all existing users into memory
    const existingUsersRes = await client.query('SELECT id, "membershipId" FROM "User"');
    const existingUserMap = new Map();
    for (const u of existingUsersRes.rows) {
      if (u.membershipId) existingUserMap.set(u.membershipId, u.id);
    }

    // 2. Fetch existing physical metric userIds
    const metricsRes = await client.query('SELECT DISTINCT "userId" FROM "PhysicalMetric"');
    const existingMetricsSet = new Set(metricsRes.rows.map(r => r.userId));

    // 3. Fetch existing memberships by userId
    const membershipsRes = await client.query('SELECT id, "userId" FROM "Membership"');
    const existingMembershipMap = new Map();
    for (const m of membershipsRes.rows) {
      existingMembershipMap.set(m.userId, m.id);
    }

    console.log(`Existing in DB: ${existingUserMap.size} users, ${existingMembershipMap.size} memberships.`);

    await client.query('BEGIN');

    const membershipEndDate = new Date();
    membershipEndDate.setFullYear(membershipEndDate.getFullYear() + 1);

    let insertedUsers = 0;
    let updatedUsers = 0;
    let insertedMemberships = 0;
    let updatedMemberships = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawId = row['Membership ID '] ?? row['Membership ID'];
      const membershipId = `CG${rawId}`;
      const firstName = String(row['First Name'] || '').trim();
      const lastName = String(row['Last Name'] || '').trim();
      const address = row['Address'] ? String(row['Address']).trim() : null;
      const { phone, note } = cleanPhoneAndNotes(row['Phone Number']);
      const nic = row['NIC Number'] ? String(row['NIC Number']).trim() : null;
      const joinDate = parseDateStr(row['Joining Date ']) || new Date();
      const dob = parseDateStr(row['Birth Date ']);
      const height = parseHeightToCm(row['Hight']);
      const weight = parseWeight(row['Weight - kg']);

      let userId = existingUserMap.get(membershipId);

      if (userId) {
        await client.query(`
          UPDATE "User" SET
            "firstName" = $1,
            "lastName" = $2,
            phone = $3,
            address = $4,
            dob = $5,
            height = $6,
            weight = $7,
            "joinDate" = $8,
            "specialCases" = COALESCE($9, "specialCases"),
            "updatedAt" = NOW()
          WHERE id = $10
        `, [firstName, lastName, phone, address, dob, height, weight, joinDate, note, userId]);
        updatedUsers++;
      } else {
        userId = crypto.randomUUID();
        existingUserMap.set(membershipId, userId);
        await client.query(`
          INSERT INTO "User" (
            id, "firstName", "lastName", email, "membershipId", nic, "imageUrl",
            password, phone, address, dob, role, "specialCases", injuries, "dietAlerts",
            height, weight, "targetWeight", "joinDate", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, 'MEMBER', $12, NULL, NULL,
            $13, $14, NULL, $15, NOW(), NOW()
          )
        `, [
          userId, firstName, lastName, null, membershipId, nic, null,
          defaultPasswordHash, phone, address, dob, note,
          height, weight, joinDate
        ]);
        insertedUsers++;
      }

      // Weight metric
      if (weight && !existingMetricsSet.has(userId)) {
        await client.query(`
          INSERT INTO "PhysicalMetric" (id, "userId", weight, date)
          VALUES ($1, $2, $3, $4)
        `, [crypto.randomUUID(), userId, weight, joinDate]);
        existingMetricsSet.add(userId);
      }

      // Active Membership
      const memId = existingMembershipMap.get(userId);
      if (memId) {
        await client.query(`
          UPDATE "Membership" SET
            status = 'ACTIVE',
            "startDate" = $1,
            "endDate" = $2,
            "baseFee" = 20000,
            "maintenanceFee" = 500,
            branch = COALESCE(branch, 'Main Branch'),
            "packageTime" = COALESCE("packageTime", 'Full Time'),
            "packageName" = COALESCE("packageName", 'Annual'),
            "packageDuration" = COALESCE("packageDuration", '12 Months'),
            "updatedAt" = NOW()
          WHERE id = $3
        `, [joinDate, membershipEndDate, memId]);
        updatedMemberships++;
      } else {
        const newMemId = crypto.randomUUID();
        existingMembershipMap.set(userId, newMemId);
        await client.query(`
          INSERT INTO "Membership" (
            id, "userId", "startDate", "endDate", status, branch,
            "packageTime", "packageName", "packageDuration",
            "baseFee", "maintenanceFee", "penaltyFee", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, 'ACTIVE', 'Main Branch',
            'Full Time', 'Annual', '12 Months',
            20000, 500, 0, NOW(), NOW()
          )
        `, [newMemId, userId, joinDate, membershipEndDate]);
        insertedMemberships++;
      }

      if ((i + 1) % 20 === 0 || i === rows.length - 1) {
        console.log(`Processed ${i + 1} / ${rows.length} members...`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Users Inserted: ${insertedUsers}`);
    console.log(`Users Updated: ${updatedUsers}`);
    console.log(`Memberships Inserted: ${insertedMemberships}`);
    console.log(`Memberships Updated: ${updatedMemberships}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import Error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runImport().catch(console.error);
