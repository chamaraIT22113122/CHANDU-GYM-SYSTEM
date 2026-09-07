import { Router } from 'express';
import db from '../lib/db';
import { verifyToken } from '../lib/auth';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_chandu_gym_key_change_in_production";

// GET /api/attendance - Today's attendance records
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = `
      SELECT a.*, 
             u."firstName", u."lastName", u."membershipId"
      FROM "Attendance" a
      JOIN "User" u ON a."userId" = u.id
      WHERE a."checkIn" >= $1
      ORDER BY a."checkIn" DESC
    `;
    const result = await db.query(query, [today]);

    const formatted = result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      user: {
        firstName: row.firstName,
        lastName: row.lastName,
        membershipId: row.membershipId
      }
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

// GET /api/attendance/token - Generate a dynamic short-lived QR token (30 seconds)
router.get('/token', async (req, res) => {
  try {
    const tokenCookie = req.cookies?.auth_token;
    if (!tokenCookie) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(tokenCookie) as any;

    if (!decoded || !decoded.id) return res.status(401).json({ error: "Unauthorized" });
    const userId = decoded.id;

    // Generate a QR code token valid for 90 seconds (refreshed every 60s on frontend)
    const qrToken = jwt.sign(
      { type: 'attendance_qr', userId, date: new Date().toISOString().split('T')[0] },
      JWT_SECRET,
      { expiresIn: '90s' }
    );

    return res.json({ token: qrToken });
  } catch (error) {
    console.error("Error generating QR token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

// POST /api/attendance/scan - Verify QR and mark check-in or check-out
router.post('/scan', async (req, res) => {
  try {
    const { token, override } = req.body;
    if (!token) return res.status(400).json({ error: "Missing QR token" });

    // Verify the JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired QR code. Ask the member to refresh their pass." });
    }

    if (decoded.type !== 'attendance_qr') {
      return res.status(400).json({ error: "Invalid token type" });
    }

    const { userId, date } = decoded;
    const today = new Date().toISOString().split('T')[0];

    if (date !== today) {
      return res.status(400).json({ error: "QR code is not valid for today" });
    }

    // Verify user exists
    const userResult = await db.query(
      'SELECT "firstName", "lastName", "membershipId" FROM "User" WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    const user = userResult.rows[0];

    // ── Membership & Payment Validation ──────────────────────────────────────
    if (!override) {
      // 1. Check if member has an active membership
      const membershipResult = await db.query(
        `SELECT id, "endDate" FROM "Membership" WHERE "userId" = $1 ORDER BY "endDate" DESC LIMIT 1`,
        [userId]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          error: `No membership found for ${user.firstName} ${user.lastName}. Please visit the front desk.`,
          requiresOverride: true,
          memberName: `${user.firstName} ${user.lastName}`
        });
      }

      const membership = membershipResult.rows[0];
      const endDate = new Date(membership.endDate);
      const now = new Date();

      if (endDate < now) {
        return res.status(403).json({
          error: `Membership expired on ${endDate.toLocaleDateString('en-GB')} for ${user.firstName} ${user.lastName}. Please renew at the front desk.`,
          requiresOverride: true,
          memberName: `${user.firstName} ${user.lastName}`
        });
      }

      // 2. Check for any pending/overdue payments
      const paymentResult = await db.query(
        `SELECT id FROM "Payment" WHERE "userId" = $1 AND status = 'PENDING' LIMIT 1`,
        [userId]
      );

      if (paymentResult.rows.length > 0) {
        return res.status(403).json({
          error: `${user.firstName} ${user.lastName} has a pending payment. Please clear dues at the front desk.`,
          requiresOverride: true,
          memberName: `${user.firstName} ${user.lastName}`
        });
      }
    }
    // ── End Validation ────────────────────────────────────────────────────────

    // Check if member already has a check-in today (for check-out logic)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const checkQuery = `
      SELECT id, "checkOut" FROM "Attendance"
      WHERE "userId" = $1 AND "checkIn" >= $2
      ORDER BY "checkIn" DESC
      LIMIT 1
    `;
    const checkResult = await db.query(checkQuery, [userId, startOfDay]);

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      
      // If already checked in but not checked out, mark check-out
      if (!existing.checkOut) {
        await db.query(
          `UPDATE "Attendance" SET "checkOut" = NOW() WHERE id = $1`,
          [existing.id]
        );
        return res.json({
          success: true,
          action: 'checkout',
          message: `✅ Goodbye, ${user.firstName} ${user.lastName}! Have a great day!`
        });
      } else {
        // Already checked in AND out — allow a new check-in for another session
        // (e.g., came back later in the day)
      }
    }

    // Mark new check-in
    await db.query(
      `INSERT INTO "Attendance" ("id", "userId", "checkIn") VALUES (gen_random_uuid(), $1, NOW())`,
      [userId]
    );

    return res.json({
      success: true,
      action: 'checkin',
      overridden: !!override,
      message: `Welcome, ${user.firstName}${override ? ' (Admin Override)' : ''}! 💪`
    });

  } catch (error) {
    console.error("Error processing QR scan:", error);
    return res.status(500).json({ error: "Failed to process scan" });
  }
});

export default router;