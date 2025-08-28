export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation'

export default function MarketInsightsPage() {
  redirect('/dashboard?tab=market')
}

