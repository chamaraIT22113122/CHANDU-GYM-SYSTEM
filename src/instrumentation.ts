export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to ensure it only runs on the Node server (not Edge)
    const { startNotificationEngine } = await import('./lib/cron');
    startNotificationEngine();
  }
}
