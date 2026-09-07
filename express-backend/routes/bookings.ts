import { Router } from 'express';
import crypto from 'crypto';
import db from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const dayOfWeekStr = req.query.dayOfWeek as string;
    const userId = req.query.userId as string;
    const bookingDateStr = req.query.bookingDate as string;

    let query = `
      SELECT b.*,
             u."firstName", u."lastName", u."membershipId"
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      WHERE b.status = 'SCHEDULED'
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (dayOfWeekStr) {
      query += ` AND b."dayOfWeek" = $${paramCount}`;
      values.push(dayOfWeekStr);
      paramCount++;
    }
    
    if (bookingDateStr) {
      query += ` AND b."bookingDate" = $${paramCount}`;
      values.push(bookingDateStr);
      paramCount++;
    }
    
    if (userId) {
      query += ` AND b."userId" = $${paramCount}`;
      values.push(userId);
      paramCount++;
    }

    query += ` ORDER BY b."dayOfWeek" ASC`;

    const result = await db.query(query, values);

    const formatted = result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      dayOfWeek: row.dayOfWeek,
      bookingDate: row.bookingDate ? `${row.bookingDate.getFullYear()}-${String(row.bookingDate.getMonth() + 1).padStart(2, '0')}-${String(row.bookingDate.getDate()).padStart(2, '0')}` : null,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      user: {
        firstName: row.firstName,
        lastName: row.lastName,
        membershipId: row.membershipId
      }
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, dayOfWeek, bookingDate, startTime, endTime } = req.body;

    // Fetch dynamic capacity
    const capacityResult = await db.query(`SELECT value FROM "SystemSetting" WHERE key = 'max_capacity'`);
    const capacitySetting = capacityResult.rows[0];
    const maxCapacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 20;

    // Check capacity based on bookingDate and startTime
    const existingBookingsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM "Booking" 
      WHERE "bookingDate" = $1 AND "startTime" = $2 AND status = 'SCHEDULED'
    `, [bookingDate, startTime]);
    
    const existingBookings = parseInt(existingBookingsResult.rows[0].count, 10);

    if (existingBookings >= maxCapacity) {
      return res.status(400).json({ error: `Time slot is fully booked. Maximum capacity is ${maxCapacity}.` });
    }

    const insertText = `
      INSERT INTO "Booking" (
        id, "userId", "dayOfWeek", "bookingDate", "startTime", "endTime", status, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'SCHEDULED', NOW(), NOW()
      ) RETURNING *
    `;
    const insertValues = [crypto.randomUUID(), userId, dayOfWeek, bookingDate, startTime, endTime];
    
    const bookingResult = await db.query(insertText, insertValues);

    // Create Notification
    try {
      const { verifyToken } = require('../lib/auth');
      const token = req.cookies?.auth_token;
      let actor = null;
      if (token) {
        actor = verifyToken(token);
      }
      
      const memberResult = await db.query(`SELECT "firstName", "lastName" FROM "User" WHERE id = $1`, [userId]);
      const member = memberResult.rows[0];
      const memberName = member ? `${member.firstName} ${member.lastName}` : "A member";

      const formattedDate = bookingDate ? new Date(bookingDate).toLocaleDateString() : dayOfWeek;

      if (actor && (actor.role === 'ADMIN' || actor.role === 'INSTRUCTOR')) {
        // Notify the member that admin booked/rescheduled
        await db.query(`
          INSERT INTO "Notification" ("userId", "targetRole", "targetUserId", type, title, message, link)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          actor.id, 
          'MEMBER', 
          userId, 
          'BOOKING_NEW', 
          'Schedule Updated', 
          `Your schedule was updated for ${formattedDate} at ${startTime}.`, 
          '/member'
        ]);
      } else {
        // Notify the admin that member booked/rescheduled
        await db.query(`
          INSERT INTO "Notification" ("userId", "targetRole", "targetUserId", type, title, message, link)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          userId, 
          'ADMIN', 
          null, 
          'BOOKING_NEW', 
          'New Member Booking', 
          `${memberName} booked a session for ${formattedDate} at ${startTime}.`, 
          `/admin/members/${userId}`
        ]);
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    return res.status(201).json(bookingResult.rows[0]);
  } catch (error) {
    console.error("Failed to create booking:", error);
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM "Booking" WHERE id = $1`, [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete booking:", error);
    return res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
