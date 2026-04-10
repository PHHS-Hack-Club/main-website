'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ReauthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnTo = searchParams.get('return') || '/portal/mail/settings'
  const [status, setStatus] = useState<'issuing' | 'done' | 'error'>('issuing')

  useEffect(() => {
    fetch('/api/auth/step-up/issue', { method: 'POST' })
      .then((res) => {
        if (res.ok) {
          setStatus('done')
          router.replace(returnTo)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [returnTo, router])

  if (status === 'issuing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Verifying your session…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Verification failed. Please sign in again.</p>
          <a href="/api/auth/login" className="text-[#ec3750] hover:underline">Sign in</a>
        </div>
      </div>
    )
  }

  return null
}
