export const dynamic = 'force-dynamic';
import { Router } from 'express';
const router = Router();
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

router.get('/', async (req, res) => {
  try {
    // Check if an admin already exists
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (adminExists) {
      return res.json({ message: "Admin already exists." }, { status: 400 });
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

    return res.json({ 
      message: "Admin created successfully. Please login and change the password.",
      email: admin.email,
      password: "admin123"
    });
  } catch (error) {
    console.error("Setup error:", error);
    return res.json({ error: "Failed to setup admin" }, { status: 500 });
  }
}

export default router;
