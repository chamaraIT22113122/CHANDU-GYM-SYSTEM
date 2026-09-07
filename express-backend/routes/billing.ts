import { Router } from 'express';
import db from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id, m."startDate", m."endDate", m.status, m."baseFee", m."maintenanceFee", m."penaltyFee",
        json_build_object(
          'id', u.id,
          'membershipId', u."membershipId",
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'phone', u.phone
        ) as user
      FROM "Membership" m
      JOIN "User" u ON m."userId" = u.id
      ORDER BY m."endDate" ASC;
    `;
    const result = await db.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching billing:", error);
    return res.status(500).json({ error: "Failed to fetch billing" });
  }
});

export default router;
