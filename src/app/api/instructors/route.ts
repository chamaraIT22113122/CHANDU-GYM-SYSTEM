import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: "INSTRUCTOR",
      },
      orderBy: {
        joinDate: 'desc'
      }
    });

    return NextResponse.json(instructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json({ error: "Failed to fetch instructors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Hash password
    const rawPassword = data.password || "defaultPass123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create Instructor User
    const newInstructor = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: "INSTRUCTOR",
        specialCases: data.specialization || "General Trainer", // repurposing specialCases for specialization in prototype
      }
    });

    return NextResponse.json(newInstructor, { status: 201 });
  } catch (error) {
    console.error("Error creating instructor:", error);
    return NextResponse.json({ error: "Failed to create instructor" }, { status: 500 });
  }
}
