import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      where: {
        role: "MEMBER",
      },
      include: {
        memberships: true,
        attendances: {
          orderBy: {
            checkIn: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        joinDate: 'desc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create User and Membership in a transaction
    const newMember = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          membershipId: data.membershipId || null,
          nic: data.nic || null,
          imageUrl: data.imageUrl || null,
          password: data.password || "defaultPassword123", // Ideally hashed, but skipped for demo
          phone: data.phone || null,
          role: "MEMBER",
          specialCases: data.specialCases || null,
          injuries: data.injuries || null,
          dietAlerts: data.dietAlerts || null,
          height: data.height ? parseFloat(data.height) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : null,
        }
      });

      if (data.initialWeight) {
        await tx.physicalMetric.create({
          data: {
            userId: user.id,
            weight: parseFloat(data.initialWeight),
            date: new Date()
          }
        });
      }

      if (data.planStartDate && data.planEndDate) {
        await tx.membership.create({
          data: {
            userId: user.id,
            startDate: new Date(data.planStartDate),
            endDate: new Date(data.planEndDate),
            baseFee: parseFloat(data.baseFee) || 0,
            maintenanceFee: data.maintenanceFee !== undefined && data.maintenanceFee !== "" ? parseFloat(data.maintenanceFee) : 0,
            status: "ACTIVE",
            branch: data.branch,
            packageTime: data.packageTime,
            packageName: data.packageName,
            packageDuration: data.packageDuration
          }
        });
      }

      return user;
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    console.error("Error creating member:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target?.[0] || 'field';
      return NextResponse.json({ error: `A member with this ${target} already exists.` }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
