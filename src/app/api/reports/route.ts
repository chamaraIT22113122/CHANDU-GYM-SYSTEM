import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    
    // 1. Total Revenue YTD
    const ytdPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { date: { gte: firstDayOfYear } }
    });
    const totalRevenueYtd = ytdPayments._sum.amount || 0;

    // 2. Active Members
    const activeMembers = await prisma.membership.count({
      where: { status: "ACTIVE" }
    });

    // 3. Avg Daily Check-ins (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttendances = await prisma.attendance.count({
      where: { checkIn: { gte: thirtyDaysAgo } }
    });
    const avgDailyCheckins = Math.round(recentAttendances / 30);

    // 4. Churn Rate (Expired vs Total)
    const totalMemberships = await prisma.membership.count();
    const churnedMemberships = await prisma.membership.count({
      where: { status: { in: ["OVERDUE", "SUSPENDED"] } }
    });
    const churnRate = totalMemberships > 0 ? ((churnedMemberships / totalMemberships) * 100).toFixed(1) : "0.0";

    // 5. Monthly Revenue Data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthNames.map(m => ({ month: m, value: 0 }));
    
    const allPaymentsThisYear = await prisma.payment.findMany({
      where: { date: { gte: firstDayOfYear } }
    });
    
    allPaymentsThisYear.forEach(p => {
      const monthIdx = new Date(p.date).getMonth();
      monthlyRevenue[monthIdx].value += p.amount;
    });
    
    // Trim to current month
    const currentMonthIdx = now.getMonth();
    const chartRevenue = monthlyRevenue.slice(0, currentMonthIdx + 1);

    // 6. Peak Hours Data
    const peakHoursTemplate = [
      { hour: '6 AM', count: 0 },
      { hour: '9 AM', count: 0 },
      { hour: '12 PM', count: 0 },
      { hour: '3 PM', count: 0 },
      { hour: '6 PM', count: 0 },
      { hour: '9 PM', count: 0 },
    ];
    
    const allAttendances = await prisma.attendance.findMany();
    allAttendances.forEach(a => {
      const h = new Date(a.checkIn).getHours();
      if (h >= 5 && h < 8) peakHoursTemplate[0].count++;
      else if (h >= 8 && h < 11) peakHoursTemplate[1].count++;
      else if (h >= 11 && h < 14) peakHoursTemplate[2].count++;
      else if (h >= 14 && h < 17) peakHoursTemplate[3].count++;
      else if (h >= 17 && h < 20) peakHoursTemplate[4].count++;
      else peakHoursTemplate[5].count++;
    });

    return NextResponse.json({
      totalRevenueYtd,
      activeMembers,
      avgDailyCheckins,
      churnRate,
      monthlyRevenue: chartRevenue,
      peakHours: peakHoursTemplate
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed to fetch reports data" }, { status: 500 });
  }
}
