import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT id, "firstName", "lastName", email, phone, "specialCases", "joinDate" FROM "User" WHERE role = 'INSTRUCTOR' ORDER BY "joinDate" DESC`);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return res.status(500).json({ error: "Failed to fetch instructors" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, specialization } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const instructorId = crypto.randomUUID();
    
    await db.query(
      `INSERT INTO "User" (id, "firstName", "lastName", email, password, phone, "specialCases", role, "joinDate", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'INSTRUCTOR', NOW(), NOW(), NOW())`,
      [instructorId, firstName, lastName, email, hashedPassword, phone, specialization]
    );
    return res.json({ success: true, id: instructorId });
  } catch (error) {
    console.error("Error creating instructor:", error);
    return res.status(500).json({ error: "Failed to create instructor" });
  }
});

export default router;
