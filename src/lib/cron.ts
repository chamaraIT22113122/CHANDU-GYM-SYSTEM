import cron from "node-cron";
import { prisma } from "./prisma";

// This simulates the Notification Engine running in the background.
// In a real production Next.js app, this might be triggered via a Vercel Cron Job hitting an API endpoint,
// or a separate Node.js worker process. We use node-cron for local prototype demonstration.

export function startNotificationEngine() {
  console.log("🚀 Starting Background Notification Engine...");

  // Runs every day at 1:00 AM (or every minute for testing: '* * * * *')
  // We'll use every minute for the prototype so you can see it trigger if dates match.
  cron.schedule("* * * * *", async () => {
    console.log("⏰ [Cron] Running Daily Membership Checks...");
    
    try {
      const now = new Date();
      
      const activeMemberships = await prisma.membership.findMany({
        where: {
          status: { in: ["ACTIVE", "OVERDUE"] },
        },
        include: {
          user: true
        }
      });

      for (const membership of activeMemberships) {
        const endDate = new Date(membership.endDate);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Difference in days

        // 1. T-3 Pre-Renewal Alert (3 days before due)
        if (daysDiff === 3 && membership.status === "ACTIVE") {
          console.log(`[T-3 ALERT] Sending pre-renewal SMS to ${membership.user.firstName} (Due in 3 days)`);
          // TODO: Integrate WhatsApp/Notify.lk API here
        }

        // 2. Due Date Notice (exactly 0 days)
        if (daysDiff === 0 && membership.status === "ACTIVE") {
          console.log(`[DUE DATE ALERT] Sending due date SMS to ${membership.user.firstName}`);
          // TODO: Integrate WhatsApp/Notify.lk API here
        }

        // 3. Overdue Penalty Logic (T+5 days overdue, i.e., -5 days)
        if (daysDiff <= -5 && membership.status === "ACTIVE") {
          console.log(`[OVERDUE ALERT] ${membership.user.firstName} is 5 days overdue. Suspending access and adding penalty.`);
          
          await prisma.membership.update({
            where: { id: membership.id },
            data: {
              status: "SUSPENDED",
              penaltyFee: membership.penaltyFee + 500, // Add 500 LKR late penalty
            }
          });
          
          // TODO: Integrate WhatsApp/Notify.lk API here
        }
      }
      
    } catch (error) {
      console.error("Error in background job:", error);
    }
  });
}
