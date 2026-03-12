'use client'

import { useState, useEffect, useCallback } from 'react'

interface CarouselImage {
  id: string
  src: string
  alt: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  /** grid thumbnail height in px, default 220 */
  thumbHeight?: number
  /** grid column min width, default 280 */
  thumbMinWidth?: number
}

export default function ImageCarousel({ images, thumbHeight = 220, thumbMinWidth = 280 }: ImageCarouselProps) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, prev, next, close])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function openAt(i: number) {
    setIndex(i)
    setOpen(true)
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${thumbMinWidth}px, 1fr))`,
        gap: 'var(--space-2)',
      }}>
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => openAt(i)}
            style={{
              display: 'block',
              padding: 0,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              cursor: 'zoom-in',
              background: 'none',
              transition: 'border-color 200ms, transform 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(236, 55, 80, 0.4)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              style={{ width: '100%', height: thumbHeight, objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9900,
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Counter */}
          <div
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.1em',
              pointerEvents: 'none',
            }}
          >
            {index + 1} / {images.length}
          </div>

          {/* Close button */}
          <button
            onClick={close}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.25rem 0.5rem',
            }}
          >
            ✕
          </button>

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: 'min(92vw, 1100px)',
              maxHeight: '85vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index].src}
              alt={images[index].alt}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                display: 'block',
              }}
            />
          </div>

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--snow)',
                  fontSize: '1.2rem',
                  width: 44,
                  height: 44,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--snow)',
                  fontSize: '1.2rem',
                  width: 44,
                  height: 44,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              >
                ›
              </button>

              {/* Dot strip */}
              <div style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '0.4rem',
              }}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                    style={{
                      width: i === index ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === index ? 'var(--red)' : 'rgba(255,255,255,0.25)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'width 200ms, background 200ms',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
