export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation'

export default function DataTablePage() {
  // Redirect Data Table standalone route into Sticker Dashboard tab
  redirect('/dashboard?view=table')
}
