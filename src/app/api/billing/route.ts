import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const memberships = await prisma.membership.findMany({
      include: {
        user: {
          select: {
            id: true,
            membershipId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Error fetching billing data:", error);
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}
