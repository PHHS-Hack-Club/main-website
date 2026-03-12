'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="card stack">
      <h2 style={{ margin: 0 }}>Admin error</h2>
      <p style={{ color: 'var(--muted)', margin: 0 }}>{error.message || 'Something went wrong in the admin area.'}</p>
      <button type="button" className="btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
