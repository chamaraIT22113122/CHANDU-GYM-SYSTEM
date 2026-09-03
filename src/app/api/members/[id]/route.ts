import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        memberships: true,
        dietPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        workoutPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        metrics: {
          orderBy: { date: 'asc' }
        },
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 30
        }
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching member details:", error);
    return NextResponse.json({ error: "Failed to fetch member details" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updatedMember = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        membershipId: data.membershipId,
        phone: data.phone,
        specialCases: data.specialCases,
        injuries: data.injuries,
        dietAlerts: data.dietAlerts,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : null,
      }
    });

    // Also update the active membership if these fields are provided
    if (data.branch || data.packageTime || data.packageName || data.packageDuration) {
      const activeMembership = await prisma.membership.findFirst({
        where: { userId: id, status: "ACTIVE" }
      });
      if (activeMembership) {
        await prisma.membership.update({
          where: { id: activeMembership.id },
          data: {
            branch: data.branch !== undefined ? data.branch : activeMembership.branch,
            packageTime: data.packageTime !== undefined ? data.packageTime : activeMembership.packageTime,
            packageName: data.packageName !== undefined ? data.packageName : activeMembership.packageName,
            packageDuration: data.packageDuration !== undefined ? data.packageDuration : activeMembership.packageDuration,
          }
        });
      }
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Prisma takes care of cascade deletes if configured, but to be safe:
    // Delete memberships, attendances, plans related to the user first.
    await prisma.$transaction(async (tx) => {
      await tx.membership.deleteMany({ where: { userId: id } });
      await tx.attendance.deleteMany({ where: { userId: id } });
      await tx.workoutPlan.deleteMany({ where: { userId: id } });
      await tx.dietPlan.deleteMany({ where: { userId: id } });
      await tx.physicalMetric.deleteMany({ where: { userId: id } });
      
      // Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
