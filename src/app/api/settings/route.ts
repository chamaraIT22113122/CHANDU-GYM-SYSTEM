import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array of key/value pairs to a single object
    const settingsObj = settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    // Provide defaults if not exists
    if (!settingsObj.max_capacity) settingsObj.max_capacity = "20";
    if (!settingsObj.gymName) settingsObj.gymName = "Chandu Fitness Center";
    // Add other defaults as necessary...

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error("Failed to fetch settings", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // body should be an object of key/value pairs
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      } else if (typeof value === "number" || typeof value === "boolean") {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
