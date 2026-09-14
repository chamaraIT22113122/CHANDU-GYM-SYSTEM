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

// PATCH /api/bookings/:id/extend - Extend an active booking by 30 mins
router.patch('/:id/extend', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch current booking
    const bookingResult = await db.query(`SELECT * FROM "Booking" WHERE id = $1`, [id]);
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const booking = bookingResult.rows[0];

    // Calculate new end time (+30 minutes)
    const [endHour, endMin] = booking.endTime.split(':').map(Number);
    let newEndHour = endHour;
    let newEndMin = endMin + 30;
    if (newEndMin >= 60) {
      newEndHour += 1;
      newEndMin -= 60;
    }
    const newEndTimeStr = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;

    // Optional: Check if extending crosses midnight or closing time, but assuming 24h format.

    // Fetch dynamic capacity
    const capacityResult = await db.query(`SELECT value FROM "SystemSetting" WHERE key = 'max_capacity'`);
    const capacitySetting = capacityResult.rows[0];
    const maxCapacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 20;

    // Check capacity for the newly extended timeslot (using the original end time as the start of the extension block)
    const existingBookingsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM "Booking" 
      WHERE "bookingDate" = $1 
      AND "startTime" < $3 AND "endTime" > $2 
      AND status = 'SCHEDULED'
    `, [booking.bookingDate, booking.endTime, newEndTimeStr]);
    
    const existingBookings = parseInt(existingBookingsResult.rows[0].count, 10);

    // Subtract 1 because their own booking might overlap if we don't exclude it, but here we are checking the new block
    if (existingBookings >= maxCapacity) {
      return res.status(400).json({ error: `Cannot extend. The gym is at maximum capacity (${maxCapacity}) for the next 30 minutes.` });
    }

    // Update the booking
    await db.query(`UPDATE "Booking" SET "endTime" = $1, "updatedAt" = NOW() WHERE id = $2`, [newEndTimeStr, id]);

    return res.json({ success: true, newEndTime: newEndTimeStr });
  } catch (error) {
    console.error("Failed to extend booking:", error);
    return res.status(500).json({ error: "Failed to extend booking" });
  }
});

export default router;
