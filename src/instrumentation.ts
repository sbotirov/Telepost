export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler/cron')
    startScheduler()

    const { startBotListener } = await import('./lib/telegram/botListener')
    startBotListener()
  }
}
