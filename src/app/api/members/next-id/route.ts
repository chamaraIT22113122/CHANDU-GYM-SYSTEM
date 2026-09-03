import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all members who have a numeric membership ID
    const members = await prisma.user.findMany({
      where: {
        role: "MEMBER",
        membershipId: {
          not: null
        }
      },
      select: {
        membershipId: true
      }
    });

    // Extract all numeric IDs and sort them
    const ids = members
      .map(m => parseInt(m.membershipId as string))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);

    let nextId = 10000; // Base ID

    // Find the first empty slot starting from 10000
    for (const id of ids) {
      if (id === nextId) {
        nextId++;
      } else if (id > nextId) {
        // We found a gap
        break;
      }
    }

    return NextResponse.json({ nextId: nextId.toString() });
  } catch (error) {
    console.error("Error generating next ID:", error);
    return NextResponse.json({ error: "Failed to generate ID" }, { status: 500 });
  }
}
