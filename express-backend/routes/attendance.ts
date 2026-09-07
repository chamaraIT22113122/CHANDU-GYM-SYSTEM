import { Router } from 'express';
import db from '../lib/db';

const router = Router();

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

    // Format to match expected frontend output
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

export default router;
