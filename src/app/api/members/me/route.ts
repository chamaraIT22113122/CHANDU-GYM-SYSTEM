import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_chandu_gym_key_change_in_production"
);

export async function GET() {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;

    const member = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        memberships: true,
        dietPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        workoutPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 100
        },
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 30
        }
      }
    });

    if (!member) {
      return NextResponse.json({ error: "No members found in database" }, { status: 404 });
    }

    // Calculate Streak
    let currentStreak = 0;
    if (member.attendances && member.attendances.length > 0) {
      const dates = [...new Set(member.attendances.map(a => new Date(a.checkIn).toDateString()))];
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      
      if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
        let checkDate = dates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
        for (const d of dates) {
          if (d === checkDate.toDateString()) {
            currentStreak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          } else {
            break;
          }
        }
      }
    }

    // Calculate Gym Capacity
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeAttendances = await prisma.attendance.count({
      where: {
        checkIn: { gte: startOfDay },
        checkOut: null
      }
    });

    const maxCapSetting = await prisma.systemSetting.findUnique({ where: { key: "max_capacity" } });
    const maxCap = parseInt(maxCapSetting?.value || "50", 10);
    const capacityPct = Math.min(100, Math.round((activeAttendances / maxCap) * 100));

    // Calculate Visits This Month & Avg Duration
    let visitsThisMonth = 0;
    let totalDurationMs = 0;
    let sessionsWithCheckout = 0;

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    if (member.attendances) {
      member.attendances.forEach(a => {
        if (new Date(a.checkIn) >= firstDayOfMonth) {
          visitsThisMonth++;
        }
        if (a.checkOut) {
          totalDurationMs += new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime();
          sessionsWithCheckout++;
        }
      });
    }

    let avgDurationStr = "N/A";
    if (sessionsWithCheckout > 0) {
      const avgMs = totalDurationMs / sessionsWithCheckout;
      const avgMins = Math.floor(avgMs / 60000);
      const hrs = Math.floor(avgMins / 60);
      const mins = avgMins % 60;
      avgDurationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    }

    return NextResponse.json({
      ...member,
      currentStreak,
      capacityPct,
      visitsThisMonth,
      avgDurationStr
    });
  } catch (error) {
    console.error("Error fetching 'me':", error);
    return NextResponse.json({ error: "Failed to fetch active member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;

    const data = await request.json();

    // Only allow updating specific fields for security
    const updateData: any = {};
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.height !== undefined) updateData.height = data.height ? parseFloat(data.height) : null;
    if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
    if (data.targetWeight !== undefined) updateData.targetWeight = data.targetWeight ? parseFloat(data.targetWeight) : null;
    
    // Add other editable fields here in the future if needed

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating member profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
