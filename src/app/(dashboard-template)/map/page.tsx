export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation'

export default function MapExplorerPage() {
  // Redirect Map Explorer standalone route into Sticker Dashboard tab
  redirect('/dashboard?view=map')
}
