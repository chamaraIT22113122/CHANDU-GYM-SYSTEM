import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_chandu_gym_key_change_in_production"
);

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: "Please enter your Member ID or NIC" }, { status: 400 });
    }

    // Find the member by membershipId or nic
    const user = await prisma.user.findFirst({
      where: {
        role: "MEMBER",
        OR: [
          { membershipId: identifier },
          { nic: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid Member ID or NIC" }, { status: 401 });
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName 
      } 
    });
    
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Member login error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
