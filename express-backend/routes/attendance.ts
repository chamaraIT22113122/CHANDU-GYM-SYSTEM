import { Router } from 'express';
import db from '../lib/db';
import { verifyToken } from '../lib/auth';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_chandu_gym_key_change_in_production";

// Helper to get current date in the gym's local time (Sri Lanka / Asia/Colombo)
function getLocalTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
}

// GET /api/attendance - Today's attendance records
router.get('/', async (req, res) => {
  try {
    const today = getLocalTime();
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

    // Verify if the user has a schedule for today
    const d = getLocalTime();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const bookingResult = await db.query(
      `SELECT id FROM "Booking" WHERE "userId" = $1 AND "bookingDate" = $2 AND status = 'SCHEDULED' LIMIT 1`,
      [userId, todayStr]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(403).json({ 
        requiresSchedule: true, 
        message: "No session scheduled for today." 
      });
    }

    // Generate a QR code token valid for 90 seconds (refreshed every 60s on frontend)
    const qrToken = jwt.sign(
      { type: 'attendance_qr', userId, date: getLocalTime().toISOString().split('T')[0] },
      JWT_SECRET,
      { expiresIn: '90s' }
    );

    return res.json({ token: qrToken });
  } catch (error) {
    console.error("Error generating QR token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

// Helper for processing check-in logic
async function processCheckIn(userId: string, override: boolean) {
  // Verify user exists
  const userResult = await db.query(
    'SELECT "firstName", "lastName", "membershipId" FROM "User" WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) {
    return { status: 404, error: "Member not found" };
  }
  const user = userResult.rows[0];

  // ── 1. Check for Check-out FIRST ─────────────────────────────────────────
  // If member is already checked in, scanning again means they are leaving.
  // We don't enforce schedule or payment blocks on checkout.
  const startOfDay = getLocalTime();
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
      return {
        status: 200,
        success: true,
        action: 'checkout',
        message: `✅ Goodbye, ${user.firstName} ${user.lastName}! Have a great day!`
      };
    }
  }

  // ── 2. Schedule Validation ──────────────────────────────────────────────────
  if (!override) {
    const d = getLocalTime();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const scheduleResult = await db.query(
      `SELECT id, "startTime", "endTime" FROM "Booking" WHERE "userId" = $1 AND "bookingDate" = $2 AND status = 'SCHEDULED'`,
      [userId, todayStr]
    );

    if (scheduleResult.rows.length === 0) {
      return {
        status: 403,
        error: `${user.firstName} ${user.lastName} does not have a scheduled session today.`,
        requiresOverride: true,
        memberName: `${user.firstName} ${user.lastName}`
      };
    }

    // Check if current time is within any of today's bookings (with 30 min grace period before)
    const currentMinutes = d.getHours() * 60 + d.getMinutes();
    let hasValidTimeSlot = false;

    for (const booking of scheduleResult.rows) {
      if (!booking.startTime || !booking.endTime) continue;
      
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Allow check-in 30 minutes early, and any time before the end of the session
      if (currentMinutes >= (startMinutes - 30) && currentMinutes <= endMinutes) {
        hasValidTimeSlot = true;
        break;
      }
    }

    if (!hasValidTimeSlot) {
      return {
        status: 403,
        error: `Access Denied: ${user.firstName} ${user.lastName} is not scheduled for this time slot.`,
        requiresOverride: true,
        memberName: `${user.firstName} ${user.lastName}`
      };
    }
  }
  // ── End Schedule Validation ──────────────────────────────────────────────

  // ── Membership & Payment Validation ──────────────────────────────────────
  if (!override) {
    // 1. Check if member has an active membership
    const membershipResult = await db.query(
      `SELECT id, "endDate" FROM "Membership" WHERE "userId" = $1 ORDER BY "endDate" DESC LIMIT 1`,
      [userId]
    );

    if (membershipResult.rows.length === 0) {
      return {
        status: 403,
        error: `No membership found for ${user.firstName} ${user.lastName}. Please visit the front desk.`,
        requiresOverride: true,
        memberName: `${user.firstName} ${user.lastName}`
      };
    }

    const membership = membershipResult.rows[0];
    const endDate = new Date(membership.endDate);
    const now = getLocalTime();

    if (endDate < now) {
      return {
        status: 403,
        error: `Membership expired on ${endDate.toLocaleDateString('en-GB')} for ${user.firstName} ${user.lastName}. Please renew at the front desk.`,
        requiresOverride: true,
        memberName: `${user.firstName} ${user.lastName}`
      };
    }

    // 2. Check for any pending/overdue payments
    const paymentResult = await db.query(
      `SELECT id FROM "Payment" WHERE "userId" = $1 AND status = 'PENDING' LIMIT 1`,
      [userId]
    );

    if (paymentResult.rows.length > 0) {
      return {
        status: 403,
        error: `${user.firstName} ${user.lastName} has a pending payment. Please clear dues at the front desk.`,
        requiresOverride: true,
        memberName: `${user.firstName} ${user.lastName}`
      };
    }
  }
  // ── End Validation ────────────────────────────────────────────────────────

  // Mark new check-in
  await db.query(
    `INSERT INTO "Attendance" ("id", "userId", "checkIn") VALUES (gen_random_uuid(), $1, NOW())`,
    [userId]
  );

  return {
    status: 200,
    success: true,
    action: 'checkin',
    overridden: !!override,
    message: `Welcome, ${user.firstName}${override ? ' (Admin Override)' : ''}! 💪`
  };
}

// POST /api/attendance/scan - Verify member's QR (Old approach, kept for manual entry)
router.post('/scan', async (req, res) => {
  try {
    const { token, override } = req.body;
    if (!token) return res.status(400).json({ error: "Missing QR token" });

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
    const today = getLocalTime().toISOString().split('T')[0];

    if (date !== today) {
      return res.status(400).json({ error: "QR code is not valid for today" });
    }

    const result = await processCheckIn(userId, !!override);
    if (result.status !== 200) {
      return res.status(result.status).json(result);
    }
    return res.json(result);

  } catch (error) {
    console.error("Error processing QR scan:", error);
    return res.status(500).json({ error: "Failed to process scan" });
  }
});

// GET /api/attendance/kiosk-token - Generate a dynamic token for the gym's physical kiosk
router.get('/kiosk-token', async (req, res) => {
  try {
    const tokenCookie = req.cookies?.auth_token;
    if (!tokenCookie) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(tokenCookie) as any;
    
    // Only admins should generate kiosk tokens
    if (!decoded || decoded.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });

    // Generate a QR code token valid for 90 seconds
    const qrToken = jwt.sign(
      { type: 'kiosk_qr', gymId: 'chandu-gym', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '90s' }
    );

    return res.json({ token: qrToken });
  } catch (error) {
    console.error("Error generating kiosk token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

// POST /api/attendance/scan-kiosk - Member scans the kiosk token
router.post('/scan-kiosk', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing kiosk QR token" });

    // Identify member scanning the token
    const tokenCookie = req.cookies?.auth_token;
    if (!tokenCookie) return res.status(401).json({ error: "Please log in to scan." });
    const decodedUser = verifyToken(tokenCookie) as any;
    if (!decodedUser || !decodedUser.id) return res.status(401).json({ error: "Unauthorized" });
    const userId = decodedUser.id;

    // Verify kiosk token
    let decodedKiosk: any;
    try {
      decodedKiosk = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired Gym QR code. Please try again." });
    }

    if (decodedKiosk.type !== 'kiosk_qr') {
      return res.status(400).json({ error: "Invalid token format." });
    }

    // Process check-in for the member
    const result = await processCheckIn(userId, false); // No override from member phone
    if (result.status !== 200) {
      return res.status(result.status).json(result);
    }
    return res.json(result);

  } catch (error) {
    console.error("Error scanning kiosk:", error);
    return res.status(500).json({ error: "Failed to process scan" });
  }
});

// POST /api/attendance/manual-checkin - Admin explicitly checks in a user
router.post('/manual-checkin', async (req, res) => {
  try {
    const tokenCookie = req.cookies?.auth_token;
    if (!tokenCookie) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(tokenCookie) as any;
    if (!decoded || decoded.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await processCheckIn(userId, true); // Force override = true
    if (result.status !== 200) {
      return res.status(result.status).json(result);
    }
    return res.json(result);
  } catch (error) {
    console.error("Error manual checkin:", error);
    return res.status(500).json({ error: "Failed to manually check-in" });
  }
});

// DELETE /api/attendance/:id - Admin deletes an attendance record
router.delete('/:id', async (req, res) => {
  try {
    const tokenCookie = req.cookies?.auth_token;
    if (!tokenCookie) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(tokenCookie) as any;
    if (!decoded || decoded.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    await db.query(`DELETE FROM "Attendance" WHERE id = $1`, [id]);
    
    return res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return res.status(500).json({ error: "Failed to delete record" });
  }
});

export default router;