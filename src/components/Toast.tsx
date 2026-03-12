'use client'

import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  text: string
  variant: 'success' | 'error'
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    const show = requestAnimationFrame(() => setVisible(true))

    // Auto-dismiss: success after 3.5s, error after 9s
    const duration = toast.variant === 'success' ? 3500 : 9000
    const dismiss = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, duration)

    return () => {
      cancelAnimationFrame(show)
      clearTimeout(dismiss)
    }
  }, [toast.id, toast.variant, onDismiss])

  const isSuccess = toast.variant === 'success'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface)',
        border: `1px solid ${isSuccess ? 'rgba(51, 214, 166, 0.3)' : 'rgba(236, 55, 80, 0.35)'}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${isSuccess ? 'rgba(51, 214, 166, 0.08)' : 'rgba(236, 55, 80, 0.1)'}`,
        fontSize: '0.85rem',
        fontWeight: 600,
        color: isSuccess ? 'var(--green)' : 'var(--red)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.97)',
        transition: 'opacity 220ms ease, transform 220ms ease',
        cursor: toast.variant === 'error' ? 'pointer' : 'default',
        userSelect: 'none',
        minWidth: 200,
        maxWidth: 320,
      }}
      onClick={toast.variant === 'error' ? () => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300) } : undefined}
      title={toast.variant === 'error' ? 'Click to dismiss' : undefined}
    >
      <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>
        {isSuccess ? '●' : '✕'}
      </span>
      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{toast.text}</span>
    </div>
  )
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '5rem',
        right: '1.25rem',
        zIndex: 9800,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
