import { Router } from 'express';
import db from '../lib/db';
import crypto from 'crypto';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    let query = `
      SELECT 
        p.*,
        json_build_object('firstName', u."firstName", 'lastName', u."lastName") as user
      FROM "Payment" p
      JOIN "User" u ON p."userId" = u.id
    `;
    const values: any[] = [];
    
    if (userId) {
      query += ` WHERE p."userId" = $1 `;
      values.push(userId);
    }
    
    query += ` ORDER BY p.date DESC `;
    
    const result = await db.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, membershipId, amount, method, description } = req.body;
    const paymentId = crypto.randomUUID();
    
    await db.query(
      'INSERT INTO "Payment" (id, "userId", "membershipId", amount, method, description, date) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [paymentId, userId, membershipId || null, amount, method, description || '']
    );
    
    // Also mark membership as active if this is a payment
    if (membershipId) {
      await db.query('UPDATE "Membership" SET status = $1 WHERE id = $2', ['ACTIVE', membershipId]);
    }
    
    return res.json({ success: true, paymentId });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({ error: "Failed to create payment" });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, description } = req.body;
    
    await db.query(
      'UPDATE "Payment" SET amount = $1, method = $2, description = $3 WHERE id = $4',
      [amount, method, description, id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating payment:", error);
    return res.status(500).json({ error: "Failed to update payment" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM "Payment" WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router;
