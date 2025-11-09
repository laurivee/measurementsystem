import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login for now
  redirect('/login')
}

