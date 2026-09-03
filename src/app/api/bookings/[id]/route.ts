import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dayOfWeek, startTime, endTime, status } = body;

    // If changing time or day, check capacity
    if (dayOfWeek || startTime) {
      const existingBooking = await prisma.booking.findUnique({ where: { id } });
      if (!existingBooking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const bookingDayOfWeek = dayOfWeek || existingBooking.dayOfWeek;
      const bookingStartTime = startTime || existingBooking.startTime;
      const bookingStatus = status || existingBooking.status;

      if (bookingStatus === "SCHEDULED") {
        // Fetch dynamic capacity
        const capacitySetting = await prisma.systemSetting.findUnique({ where: { key: 'max_capacity' } });
        const maxCapacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 20;

        const existingSlotBookings = await prisma.booking.count({
          where: {
            dayOfWeek: bookingDayOfWeek,
            startTime: bookingStartTime,
            status: "SCHEDULED",
            id: { not: id } // Exclude the current booking
          }
        });

        if (existingSlotBookings >= maxCapacity) {
          return NextResponse.json(
            { error: `Time slot is fully booked. Maximum capacity is ${maxCapacity}.` },
            { status: 400 }
          );
        }
      }
    }

    const dataToUpdate: any = {};
    if (dayOfWeek) dataToUpdate.dayOfWeek = dayOfWeek;
    if (startTime) dataToUpdate.startTime = startTime;
    if (endTime) dataToUpdate.endTime = endTime;
    if (status) dataToUpdate.status = status;

    const booking = await prisma.booking.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Instead of actual delete, we can mark as CANCELLED, or just delete it
    await prisma.booking.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
