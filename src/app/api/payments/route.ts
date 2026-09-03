import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const query: any = {
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        }
      },
      orderBy: { date: 'desc' }
    };

    if (userId) {
      query.where = { userId };
    }

    const payments = await prisma.payment.findMany(query);
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, membershipId, amount, method, description } = body;

    if (!userId || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create the payment record
      const newPayment = await tx.payment.create({
        data: {
          userId,
          membershipId,
          amount: parseFloat(amount),
          method,
          description
        }
      });

      // If tied to a membership, automatically extend the membership
      if (membershipId) {
        const membership = await tx.membership.findUnique({
          where: { id: membershipId }
        });

        if (membership) {
          // Extend endDate by package duration logic (simplistic: 1 month default)
          const newEndDate = new Date(membership.endDate);
          if (membership.packageDuration === "Daily") newEndDate.setDate(newEndDate.getDate() + 1);
          else if (membership.packageDuration === "Monthly") newEndDate.setMonth(newEndDate.getMonth() + 1);
          else if (membership.packageDuration === "Quarterly") newEndDate.setMonth(newEndDate.getMonth() + 3);
          else if (membership.packageDuration === "Bi-Annual") newEndDate.setMonth(newEndDate.getMonth() + 6);
          else if (membership.packageDuration === "Annual") newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          else newEndDate.setMonth(newEndDate.getMonth() + 1); // Default

          await tx.membership.update({
            where: { id: membershipId },
            data: {
              endDate: newEndDate,
              penaltyFee: 0, // Reset penalties on payment
              status: "ACTIVE" // Set back to active if it was overdue
            }
          });
        }
      }

      return newPayment;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
