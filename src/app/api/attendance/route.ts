import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        checkIn: {
          gte: today,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
          },
        },
      },
      orderBy: {
        checkIn: "desc",
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
