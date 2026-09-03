import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Active Members
    const activeMembers = await prisma.membership.count({
      where: { status: "ACTIVE" }
    });

    // 2. Monthly Revenue
    const monthlyPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: firstDayOfMonth }
      }
    });
    const monthlyRevenue = monthlyPayments._sum.amount || 0;

    // 3. Overdue Memberships
    const overdueMemberships = await prisma.membership.count({
      where: { status: "OVERDUE" }
    });

    // 4. New Members this month
    const newMembers = await prisma.user.count({
      where: {
        role: "MEMBER",
        createdAt: { gte: firstDayOfMonth }
      }
    });

    // 5. Recent Checkins
    const recentCheckins = await prisma.attendance.findMany({
      take: 5,
      orderBy: { checkIn: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, membershipId: true }
        }
      }
    });

    return NextResponse.json({
      stats: [
        { name: "Total Active Members", value: activeMembers.toString(), color: "text-blue-500", bg: "bg-blue-500/10" },
        { name: "Monthly Revenue", value: `LKR ${monthlyRevenue.toLocaleString()}`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { name: "Overdue Memberships", value: overdueMemberships.toString(), color: "text-red-500", bg: "bg-red-500/10" },
        { name: "New This Month", value: `+${newMembers}`, color: "text-purple-500", bg: "bg-purple-500/10" },
      ],
      recentCheckins: recentCheckins.map(a => ({
        id: a.id,
        memberId: a.user.membershipId || "N/A",
        name: `${a.user.firstName} ${a.user.lastName}`,
        time: a.checkIn
      }))
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
