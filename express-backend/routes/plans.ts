import { Router } from 'express';
import crypto from 'crypto';
import db from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "GymPlan" ORDER BY price ASC');
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({ error: "Failed to fetch plans" });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // In a real app, verify admin session here

    const insertText = `
      INSERT INTO "GymPlan" (
        id, name, description, price, "registrationFee", duration, features, "isPopular", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING *
    `;
    
    const insertValues = [
      crypto.randomUUID(),
      data.name,
      data.description || null,
      parseFloat(data.price),
      data.registrationFee ? parseFloat(data.registrationFee) : 0,
      data.duration,
      JSON.stringify(data.features),
      data.isPopular || false
    ];

    const result = await db.query(insertText, insertValues);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating plan:", error);
    return res.status(500).json({ error: "Failed to create plan" });
  }
});

export default router;
