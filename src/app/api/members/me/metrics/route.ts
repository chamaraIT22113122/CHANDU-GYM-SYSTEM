import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Using the same active member logic as the 'me' route
    const member = await prisma.user.findFirst({
      where: { role: "MEMBER" },
      orderBy: { joinDate: 'desc' }
    });

    if (!member) {
      return NextResponse.json({ error: "No active member found" }, { status: 404 });
    }

    const parsedWeight = parseFloat(data.weight);
    
    // Create new metric
    const newMetric = await prisma.physicalMetric.create({
      data: {
        userId: member.id,
        weight: parsedWeight,
        date: data.date ? new Date(data.date) : new Date(),
        bodyFat: data.bodyFat ? parseFloat(data.bodyFat) : null,
        muscleMass: data.muscleMass ? parseFloat(data.muscleMass) : null,
      }
    });

    // Automatically update the user's current weight in the User model
    await prisma.user.update({
      where: { id: member.id },
      data: { weight: parsedWeight }
    });

    return NextResponse.json(newMetric, { status: 201 });
  } catch (error) {
    console.error("Error creating metric:", error);
    return NextResponse.json({ error: "Failed to log weight" }, { status: 500 });
  }
}
