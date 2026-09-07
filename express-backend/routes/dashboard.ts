import { Router } from 'express';
import db from '../lib/db';

const router = Router();

router.get('/overview', async (req, res) => {
  try {
    const activeMembersResult = await db.query(`SELECT count(DISTINCT "userId") as count FROM "Membership" WHERE status = 'ACTIVE'`);
    const activeMembers = parseInt(activeMembersResult.rows[0].count);

    const revenueResult = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM "Payment" WHERE extract(month from date) = extract(month from current_date)`);
    const monthlyRevenue = parseFloat(revenueResult.rows[0].total);

    const overdueResult = await db.query(`SELECT count(DISTINCT "userId") as count FROM "Membership" WHERE status = 'OVERDUE'`);
    const overdueMembers = parseInt(overdueResult.rows[0].count);

    const newMembersResult = await db.query(`SELECT count(*) as count FROM "User" WHERE role = 'MEMBER' AND extract(month from "joinDate") = extract(month from current_date)`);
    const newMembers = parseInt(newMembersResult.rows[0].count);

    const recentCheckinsResult = await db.query(`
      SELECT a.id, a."checkIn" as time, u."firstName" || ' ' || u."lastName" as name, u."membershipId" as "memberId"
      FROM "Attendance" a
      JOIN "User" u ON a."userId" = u.id
      ORDER BY a."checkIn" DESC
      LIMIT 10
    `);

    res.json({
      stats: [
        { name: "Total Active Members", value: activeMembers.toString(), bg: "bg-[#ccff00]/10", color: "text-[#ccff00]" },
        { name: "Monthly Revenue", value: `Rs. ${monthlyRevenue.toLocaleString()}`, bg: "bg-emerald-500/10", color: "text-emerald-500" },
        { name: "Overdue Memberships", value: overdueMembers.toString(), bg: "bg-red-500/10", color: "text-red-500" },
        { name: "New This Month", value: newMembers.toString(), bg: "bg-blue-500/10", color: "text-blue-500" },
      ],
      recentCheckins: recentCheckinsResult.rows
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
