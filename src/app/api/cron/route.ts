import { NextResponse } from 'next/server'
import { runAllCronTasks } from '@/lib/scheduler/cron'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await runAllCronTasks()
    return NextResponse.json({ success: true, time: new Date().toISOString() })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  }
}
