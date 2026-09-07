import { Router } from 'express';
import db from '../lib/db';
import { verifyToken } from '../lib/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = verifyToken(token) as any;
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    let notificationsResult;
    if (user.role === 'ADMIN') {
      notificationsResult = await db.query(`
        SELECT * FROM "Notification"
        WHERE "targetRole" = 'ADMIN' OR "targetUserId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 50
      `, [user.id]);
    } else {
      notificationsResult = await db.query(`
        SELECT * FROM "Notification"
        WHERE "targetUserId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 50
      `, [user.id]);
    }

    const notifications = notificationsResult.rows;

    if (user.role === 'ADMIN') {
      const overdueMemberships = await db.query(`
        SELECT m.*, u."firstName", u."lastName" 
        FROM "Membership" m
        JOIN "User" u ON m."userId" = u.id
        WHERE m.status = 'OVERDUE'
      `);

      overdueMemberships.rows.forEach(m => {
        notifications.push({
          id: `overdue-${m.id}`,
          type: "OVERDUE",
          title: "Overdue Membership",
          message: `${m.firstName} ${m.lastName}'s membership is overdue.`,
          date: m.endDate,
          link: `/admin/members/${m.userId}`,
          isRead: false,
          createdAt: m.endDate
        });
      });

      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const expiringMemberships = await db.query(`
        SELECT m.*, u."firstName", u."lastName" 
        FROM "Membership" m
        JOIN "User" u ON m."userId" = u.id
        WHERE m.status = 'ACTIVE' AND m."endDate" >= $1 AND m."endDate" <= $2
      `, [now, threeDaysFromNow]);

      expiringMemberships.rows.forEach(m => {
        notifications.push({
          id: `expiring-${m.id}`,
          type: "WARNING",
          title: "Membership Expiring Soon",
          message: `${m.firstName} ${m.lastName}'s membership expires on ${new Date(m.endDate).toLocaleDateString()}.`,
          date: m.endDate,
          link: `/admin/members/${m.userId}`,
          isRead: false,
          createdAt: m.endDate
        });
      });
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ notifications });
  } catch (error) {
    console.error("Notifications error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = verifyToken(token) as any;
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    if (user.role === 'ADMIN') {
      await db.query(`UPDATE "Notification" SET "isRead" = TRUE WHERE "targetRole" = 'ADMIN' OR "targetUserId" = $1`, [user.id]);
    } else {
      await db.query(`UPDATE "Notification" SET "isRead" = TRUE WHERE "targetUserId" = $1`, [user.id]);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return res.status(500).json({ error: "Failed to mark as read" });
  }
});

router.post('/clear', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = verifyToken(token) as any;
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    if (user.role === 'ADMIN') {
      await db.query(`DELETE FROM "Notification" WHERE "targetRole" = 'ADMIN' OR "targetUserId" = $1`, [user.id]);
    } else {
      await db.query(`DELETE FROM "Notification" WHERE "targetUserId" = $1`, [user.id]);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    return res.status(500).json({ error: "Failed to clear notifications" });
  }
});

export default router;
