export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation'

export default function CompaniesPage() {
  redirect('/dashboard?view=directory')
}
