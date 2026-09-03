import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const notifications = [];

    // 1. Overdue Memberships
    const overdueMemberships = await prisma.membership.findMany({
      where: { status: "OVERDUE" },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    overdueMemberships.forEach(m => {
      notifications.push({
        id: `overdue-${m.id}`,
        type: "OVERDUE",
        title: "Overdue Membership",
        message: `${m.user.firstName} ${m.user.lastName}'s membership is overdue.`,
        date: m.endDate,
        link: `/admin/members/${m.userId}`
      });
    });

    // 2. Memberships expiring in the next 3 days
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const expiringMemberships = await prisma.membership.findMany({
      where: { 
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    expiringMemberships.forEach(m => {
      notifications.push({
        id: `expiring-${m.id}`,
        type: "WARNING",
        title: "Membership Expiring Soon",
        message: `${m.user.firstName} ${m.user.lastName}'s membership expires on ${m.endDate.toLocaleDateString()}.`,
        date: m.endDate,
        link: `/admin/members/${m.userId}`
      });
    });

    // Sort by date descending (closest to expire or most overdue)
    notifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
