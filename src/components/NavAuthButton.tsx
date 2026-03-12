import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function NavAuthButton() {
  const session = await getSession()

  if (session) {
    return (
      <Link href="/portal" className="btn-outline">
        Portal
      </Link>
    )
  }

  return (
    <a href="/api/auth/login" className="btn-outline">
      Member Login
    </a>
  )
}
