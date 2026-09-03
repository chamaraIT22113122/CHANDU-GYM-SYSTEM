import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, title, data } = body;

    if (type === "workout") {
      const workoutPlan = await prisma.workoutPlan.create({
        data: {
          userId: id,
          title: title || "Custom Workout Plan",
          schedule: JSON.stringify(data), // storing JSON payload
        }
      });
      return NextResponse.json(workoutPlan, { status: 201 });
    } else if (type === "diet") {
      const dietPlan = await prisma.dietPlan.create({
        data: {
          userId: id,
          title: title || "Custom Diet Plan",
          details: JSON.stringify(data), // storing JSON payload
        }
      });
      return NextResponse.json(dietPlan, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });

  } catch (error) {
    console.error("Error saving plan:", error);
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}
