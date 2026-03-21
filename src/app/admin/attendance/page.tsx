import Link from 'next/link'
import AttendanceTracker from '@/components/admin/AttendanceTracker'


export default function AttendancePage() {
  return (
    <div className="stack">
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 'bold' }}>
        ← Admin
      </Link>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Attendance</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Track who shows up to each meeting.</p>
      </div>
      <AttendanceTracker />
    </div>
  )
}
