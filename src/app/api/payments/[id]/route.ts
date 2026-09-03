import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, method, description } = body;

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        method,
        description,
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id } });
      if (!payment) throw new Error("Payment not found");

      if (payment.membershipId) {
        const membership = await tx.membership.findUnique({ where: { id: payment.membershipId } });
        if (membership) {
          const newEndDate = new Date(membership.endDate);
          if (membership.packageDuration === "Daily") newEndDate.setDate(newEndDate.getDate() - 1);
          else if (membership.packageDuration === "Monthly") newEndDate.setMonth(newEndDate.getMonth() - 1);
          else if (membership.packageDuration === "Quarterly") newEndDate.setMonth(newEndDate.getMonth() - 3);
          else if (membership.packageDuration === "Bi-Annual") newEndDate.setMonth(newEndDate.getMonth() - 6);
          else if (membership.packageDuration === "Annual") newEndDate.setFullYear(newEndDate.getFullYear() - 1);
          else newEndDate.setMonth(newEndDate.getMonth() - 1);

          // We check if reverting makes it overdue
          const now = new Date();
          let status = membership.status;
          if (newEndDate < now) status = "OVERDUE";

          await tx.membership.update({
            where: { id: membership.id },
            data: { endDate: newEndDate, status }
          });
        }
      }

      await tx.payment.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
