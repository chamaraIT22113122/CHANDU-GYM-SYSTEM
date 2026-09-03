import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Check if an admin already exists
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (adminExists) {
      return NextResponse.json({ message: "Admin already exists." }, { status: 400 });
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin@chandugym.com",
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        role: "ADMIN",
        phone: "0000000000"
      }
    });

    return NextResponse.json({ 
      message: "Admin created successfully. Please login and change the password.",
      email: admin.email,
      password: "admin123"
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Failed to setup admin" }, { status: 500 });
  }
}
