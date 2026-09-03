import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayOfWeekStr = searchParams.get("dayOfWeek");
    const userId = searchParams.get("userId");

    const where: any = { status: "SCHEDULED" };
    if (dayOfWeekStr) {
      where.dayOfWeek = dayOfWeekStr;
    }
    if (userId) {
      where.userId = userId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, membershipId: true } }
      },
      orderBy: { dayOfWeek: 'asc' }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, dayOfWeek, startTime, endTime } = body;

    // Fetch dynamic capacity
    const capacitySetting = await prisma.systemSetting.findUnique({ where: { key: 'max_capacity' } });
    const maxCapacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 20;

    // Check capacity
    const existingBookings = await prisma.booking.count({
      where: {
        dayOfWeek,
        startTime,
        status: "SCHEDULED",
      }
    });

    if (existingBookings >= maxCapacity) {
      return NextResponse.json(
        { error: `Time slot is fully booked. Maximum capacity is ${maxCapacity}.` },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        dayOfWeek,
        startTime,
        endTime,
      }
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
