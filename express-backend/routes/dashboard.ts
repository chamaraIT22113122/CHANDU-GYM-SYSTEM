import { Router } from 'express';
import db from '../lib/db';

const router = Router();

router.get('/overview', async (req, res) => {
  try {
    const activeMembersResult = await db.query(`SELECT count(DISTINCT "userId") as count FROM "Membership" WHERE status = 'ACTIVE'`);
    const activeMembers = parseInt(activeMembersResult.rows[0].count);

    const revenueResult = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM "Payment" WHERE extract(month from date) = extract(month from current_date) AND extract(year from date) = extract(year from current_date)`);
    const monthlyRevenue = parseFloat(revenueResult.rows[0].total);

    const overdueResult = await db.query(`SELECT count(DISTINCT "userId") as count FROM "Membership" WHERE status = 'OVERDUE'`);
    const overdueMembers = parseInt(overdueResult.rows[0].count);

    const newMembersResult = await db.query(`SELECT count(*) as count FROM "User" WHERE role = 'MEMBER' AND extract(month from "joinDate") = extract(month from current_date) AND extract(year from "joinDate") = extract(year from current_date)`);
    const newMembers = parseInt(newMembersResult.rows[0].count);

    // Recent Activity (Check-ins and Payments combined conceptually, but here we just get check-ins for the feed, we can get payments too)
    const recentActivityResult = await db.query(`
      SELECT 'CHECKIN' as type, a.id, a."checkIn" as time, u."firstName" || ' ' || u."lastName" as name, u."membershipId" as "memberId", null as amount
      FROM "Attendance" a
      JOIN "User" u ON a."userId" = u.id
      UNION ALL
      SELECT 'PAYMENT' as type, p.id, p.date as time, u."firstName" || ' ' || u."lastName" as name, u."membershipId" as "memberId", p.amount
      FROM "Payment" p
      JOIN "User" u ON p."userId" = u.id
      ORDER BY time DESC
      LIMIT 15
    `);

    // Revenue History (Last 6 months)
    const revenueHistoryResult = await db.query(`
      SELECT 
        to_char(date, 'Mon') as month,
        extract(month from date) as month_num,
        SUM(CASE WHEN LOWER(description) LIKE '%maintenance%' OR LOWER(description) LIKE '%penalty%' THEN amount ELSE 0 END) as "maintenance",
        SUM(CASE WHEN LOWER(description) NOT LIKE '%maintenance%' AND LOWER(description) NOT LIKE '%penalty%' THEN amount ELSE 0 END) as "membership"
      FROM "Payment"
      WHERE date >= current_date - interval '6 months'
      GROUP BY month, month_num
      ORDER BY month_num ASC
    `);

    // Peak Hours Heatmap (group by hour of day for last 30 days)
    const peakHoursResult = await db.query(`
      SELECT 
        extract(hour from "checkIn") as hour,
        count(*) as count
      FROM "Attendance"
      WHERE "checkIn" >= current_date - interval '30 days'
      GROUP BY hour
      ORDER BY hour ASC
    `);

    // Expiring Memberships (next 7 days)
    const expiringMembersResult = await db.query(`
      SELECT 
        u.id, 
        u."firstName" || ' ' || u."lastName" as name, 
        u.email,
        m."endDate"
      FROM "Membership" m
      JOIN "User" u ON m."userId" = u.id
      WHERE m.status = 'ACTIVE' 
        AND m."endDate" >= current_date 
        AND m."endDate" <= current_date + interval '7 days'
      ORDER BY m."endDate" ASC
    `);

    res.json({
      stats: [
        { name: "Total Active Members", value: activeMembers.toString(), bg: "bg-[#ccff00]/10", color: "text-[#ccff00]" },
        { name: "Monthly Revenue", value: `Rs. ${monthlyRevenue.toLocaleString()}`, bg: "bg-emerald-500/10", color: "text-emerald-500" },
        { name: "Overdue Memberships", value: overdueMembers.toString(), bg: "bg-red-500/10", color: "text-red-500" },
        { name: "New This Month", value: newMembers.toString(), bg: "bg-blue-500/10", color: "text-blue-500" },
      ],
      recentActivity: recentActivityResult.rows,
      revenueHistory: revenueHistoryResult.rows,
      peakHours: peakHoursResult.rows,
      expiringMembers: expiringMembersResult.rows
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
