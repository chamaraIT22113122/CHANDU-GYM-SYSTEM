import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { endDate, baseFee, packageName, packageDuration } = body;

    if (!endDate || !baseFee) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the user's active/latest membership
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: "No membership found to renew." }, { status: 404 });
    }

    const currentMembershipId = user.memberships[0].id;

    // Update the membership
    const updatedMembership = await prisma.membership.update({
      where: { id: currentMembershipId },
      data: {
        endDate: new Date(endDate),
        baseFee: parseFloat(baseFee),
        status: "ACTIVE", // Reset status to active
        penaltyFee: 0,    // Clear penalties upon renewal
        ...(packageName && { packageName }),
        ...(packageDuration && { packageDuration })
      }
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error("Error updating membership:", error);
    return NextResponse.json({ error: "Failed to update membership" }, { status: 500 });
  }
}
