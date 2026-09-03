import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.gymPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // In a real app, verify admin session here

    const newPlan = await prisma.gymPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        registrationFee: data.registrationFee ? parseFloat(data.registrationFee) : 0,
        duration: data.duration,
        features: JSON.stringify(data.features), // array to string
        isPopular: data.isPopular || false
      }
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
