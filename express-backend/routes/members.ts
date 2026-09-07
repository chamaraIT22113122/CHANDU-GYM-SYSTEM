import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../lib/db';
import { verifyToken } from '../lib/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.*,
        COALESCE(
          (SELECT json_agg(m.*) FROM "Membership" m WHERE m."userId" = u.id),
          '[]'::json
        ) as memberships,
        COALESCE(
          (SELECT json_agg(a.*) FROM (
            SELECT * FROM "Attendance" WHERE "userId" = u.id ORDER BY "checkIn" DESC LIMIT 1
          ) a),
          '[]'::json
        ) as attendances
      FROM "User" u
      WHERE u.role = 'MEMBER'
      ORDER BY u."joinDate" DESC;
    `;
    const result = await db.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ error: "Failed to fetch members" });
  }
});

router.get('/next-id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT "membershipId" FROM "User" 
      WHERE "membershipId" LIKE 'CG%' 
      ORDER BY "membershipId" DESC 
      LIMIT 1
    `);
    
    let nextId = "CG10000";
    if (result.rows.length > 0 && result.rows[0].membershipId) {
      const lastId = result.rows[0].membershipId;
      const numberPart = parseInt(lastId.replace('CG', ''), 10);
      if (!isNaN(numberPart)) {
        nextId = `CG${numberPart + 1}`;
      }
    }
    return res.json({ nextId });
  } catch (error) {
    console.error("Error generating next ID:", error);
    return res.status(500).json({ error: "Failed to generate ID" });
  }
});

router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    const data = req.body;
    await client.query('BEGIN');

    const password = data.password || "defaultPassword123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const insertUserText = `
      INSERT INTO "User" (
        id, "firstName", "lastName", email, "membershipId", nic, "imageUrl", 
        password, phone, role, "specialCases", injuries, "dietAlerts", 
        height, weight, "targetWeight", "joinDate", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), NOW()
      ) RETURNING *
    `;
    const insertUserValues = [
      userId,
      data.firstName,
      data.lastName,
      data.email || null,
      data.membershipId || null,
      data.nic || null,
      data.imageUrl || null,
      hashedPassword,
      data.phone || null,
      "MEMBER",
      data.specialCases || null,
      data.injuries || null,
      data.dietAlerts || null,
      data.height ? parseFloat(data.height) : null,
      data.weight ? parseFloat(data.weight) : null,
      data.targetWeight ? parseFloat(data.targetWeight) : null
    ];

    const userResult = await client.query(insertUserText, insertUserValues);
    const user = userResult.rows[0];

    if (data.initialWeight) {
      await client.query(
        'INSERT INTO "PhysicalMetric" (id, "userId", weight, date) VALUES ($1, $2, $3, NOW())',
        [crypto.randomUUID(), userId, parseFloat(data.initialWeight)]
      );
    }

    if (data.planStartDate && data.planEndDate) {
      const insertMembershipText = `
        INSERT INTO "Membership" (
          id, "userId", "startDate", "endDate", status, "baseFee", "maintenanceFee",
          branch, "packageTime", "packageName", "packageDuration", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )
      `;
      await client.query(insertMembershipText, [
        crypto.randomUUID(),
        userId,
        new Date(data.planStartDate),
        new Date(data.planEndDate),
        "ACTIVE",
        parseFloat(data.baseFee) || 0,
        data.maintenanceFee !== undefined && data.maintenanceFee !== "" ? parseFloat(data.maintenanceFee) : 0,
        data.branch || null,
        data.packageTime || null,
        data.packageName || null,
        data.packageDuration || null
      ]);
    }

    await client.query('COMMIT');
    return res.status(201).json(user);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error creating member:", error);
    if (error.code === '23505') { // Postgres unique constraint violation
      return res.status(400).json({ error: "A member with this unique field already exists." });
    }
    return res.status(500).json({ error: "Failed to create member" });
  } finally {
    client.release();
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.id) return res.status(401).json({ error: 'Invalid token' });
    
    const id = decoded.id;

    const userQuery = `
      SELECT * FROM "User" WHERE id = $1 AND role = 'MEMBER';
    `;
    const userResult = await db.query(userQuery, [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    const member = userResult.rows[0];

    const membershipsResult = await db.query('SELECT * FROM "Membership" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [id]);
    member.memberships = membershipsResult.rows;

    const attendancesResult = await db.query('SELECT * FROM "Attendance" WHERE "userId" = $1 ORDER BY "checkIn" DESC', [id]);
    member.attendances = attendancesResult.rows;

    const metricsResult = await db.query('SELECT * FROM "PhysicalMetric" WHERE "userId" = $1 ORDER BY date ASC', [id]);
    member.metrics = metricsResult.rows;

    const dietPlansResult = await db.query('SELECT * FROM "DietPlan" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [id]);
    member.dietPlans = dietPlansResult.rows;

    const workoutPlansResult = await db.query('SELECT * FROM "WorkoutPlan" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [id]);
    member.workoutPlans = workoutPlansResult.rows;

    return res.json(member);
  } catch (error) {
    console.error("Error fetching me profile:", error);
    return res.status(500).json({ error: "Failed to fetch me details" });
  }
});

router.post('/me/metrics', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.id) return res.status(401).json({ error: 'Invalid token' });
    
    const { weight, date, bodyFat, muscleMass } = req.body;
    
    await db.query(
      'INSERT INTO "PhysicalMetric" (id, "userId", weight, date, "bodyFat", "muscleMass") VALUES ($1, $2, $3, $4, $5, $6)',
      [crypto.randomUUID(), decoded.id, parseFloat(weight), date ? new Date(date) : new Date(), bodyFat ? parseFloat(bodyFat) : null, muscleMass ? parseFloat(muscleMass) : null]
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error saving metric:", error);
    return res.status(500).json({ error: "Failed to save metric" });
  }
});

router.get('/me/workout-history', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.id) return res.status(401).json({ error: 'Invalid token' });
    
    const { date } = req.query; // expecting YYYY-MM-DD
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const result = await db.query(
      'SELECT "completedSets" FROM "WorkoutHistory" WHERE "userId" = $1 AND "date" = $2',
      [decoded.id, date]
    );
    
    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    } else {
      return res.json({ completedSets: {} });
    }
  } catch (error) {
    console.error("Error fetching workout history:", error);
    return res.status(500).json({ error: "Failed to fetch workout history" });
  }
});

router.post('/me/workout-history', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.id) return res.status(401).json({ error: 'Invalid token' });
    
    const { date, dayName, completedSets } = req.body;
    
    // UPSERT (Insert or Update) based on UNIQUE("userId", "date")
    await db.query(`
      INSERT INTO "WorkoutHistory" (id, "userId", "date", "dayName", "completedSets", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT ("userId", "date") 
      DO UPDATE SET "completedSets" = $5, "updatedAt" = NOW()
    `, [crypto.randomUUID(), decoded.id, date, dayName, JSON.stringify(completedSets)]);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error saving workout history:", error);
    return res.status(500).json({ error: "Failed to save workout history" });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userQuery = `
      SELECT * FROM "User" WHERE id = $1 AND role = 'MEMBER';
    `;
    const userResult = await db.query(userQuery, [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    const member = userResult.rows[0];

    const membershipsResult = await db.query('SELECT * FROM "Membership" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [id]);
    member.memberships = membershipsResult.rows;

    const attendancesResult = await db.query('SELECT * FROM "Attendance" WHERE "userId" = $1 ORDER BY "checkIn" DESC', [id]);
    member.attendances = attendancesResult.rows;

    const metricsResult = await db.query('SELECT * FROM "PhysicalMetric" WHERE "userId" = $1 ORDER BY date ASC', [id]);
    member.metrics = metricsResult.rows;

    const dietPlansResult = await db.query('SELECT * FROM "DietPlan" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [id]);
    member.dietPlans = dietPlansResult.rows;

    const workoutPlansResult = await db.query('SELECT * FROM "WorkoutPlan" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [id]);
    member.workoutPlans = workoutPlansResult.rows;

    return res.json(member);
  } catch (error) {
    console.error("Error fetching member:", error);
    return res.status(500).json({ error: "Failed to fetch member details" });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const updateQuery = `
      UPDATE "User" SET 
        "firstName" = $1, "lastName" = $2, email = $3, phone = $4,
        "specialCases" = $5, injuries = $6, "dietAlerts" = $7, "updatedAt" = NOW()
      WHERE id = $8 RETURNING *
    `;
    const values = [
      data.firstName, data.lastName, data.email, data.phone,
      data.specialCases, data.injuries, data.dietAlerts, id
    ];
    
    const result = await db.query(updateQuery, values);
    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({ error: "Failed to update member" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM "User" WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return res.status(500).json({ error: "Failed to delete member" });
  }
});

router.post('/:id/plans', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, data } = req.body;
    const planId = crypto.randomUUID();
    
    if (type === 'workout') {
      await db.query(
        'INSERT INTO "WorkoutPlan" (id, "userId", title, schedule, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [planId, id, title || "Workout Plan", JSON.stringify(data)]
      );
    } else if (type === 'diet') {
      await db.query(
        'INSERT INTO "DietPlan" (id, "userId", title, details, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [planId, id, title || "Diet Plan", JSON.stringify(data)]
      );
    } else {
      return res.status(400).json({ error: "Invalid plan type" });
    }
    
    // Create Notification
    try {
      const token = req.cookies?.auth_token;
      let actor = null;
      if (token) {
        actor = verifyToken(token) as any;
      }
      
      if (actor && (actor.role === 'ADMIN' || actor.role === 'INSTRUCTOR')) {
        await db.query(`
          INSERT INTO "Notification" ("userId", "targetRole", "targetUserId", type, title, message, link)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          actor.id, 
          'MEMBER', 
          id, 
          'PLAN_NEW', 
          'New Plan Added', 
          `An admin or instructor assigned you a new ${type} plan: ${title || (type === 'workout' ? 'Workout Plan' : 'Diet Plan')}.`, 
          '/member'
        ]);
      }
    } catch (notifErr) {
      console.error("Failed to create plan notification:", notifErr);
    }
    
    return res.json({ success: true, planId });
  } catch (error) {
    console.error("Error saving plan:", error);
    return res.status(500).json({ error: "Failed to save plan" });
  }
});

router.patch('/:id/membership', async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate, baseFee, packageName, packageDuration } = req.body;
    
    const checkQuery = 'SELECT id FROM "Membership" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length > 0) {
      const membershipId = checkResult.rows[0].id;
      await db.query(
        'UPDATE "Membership" SET "endDate" = $1, "baseFee" = $2, "packageName" = $3, "packageDuration" = $4, status = $5, "updatedAt" = NOW() WHERE id = $6',
        [new Date(endDate), parseFloat(baseFee), packageName, packageDuration, 'ACTIVE', membershipId]
      );
    } else {
      const newId = crypto.randomUUID();
      await db.query(
        'INSERT INTO "Membership" (id, "userId", "startDate", "endDate", status, "baseFee", "packageName", "packageDuration", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, NOW(), NOW())',
        [newId, id, new Date(endDate), 'ACTIVE', parseFloat(baseFee), packageName, packageDuration]
      );
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error renewing membership:", error);
    return res.status(500).json({ error: "Failed to renew membership" });
  }
});

export default router;
