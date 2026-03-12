'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  minHeight?: number
}

export default function MarkdownEditor({
  value,
  onChange,
  minHeight = 260,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')

  return (
    <div className="surface" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid color-mix(in srgb, var(--white) 10%, transparent)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['write', 'preview'] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              className={mode === nextMode ? 'btn-primary' : 'btn-ghost'}
              style={{
                minHeight: 34,
                padding: '0.45rem 0.9rem',
                fontSize: '0.82rem',
              }}
              onClick={() => setMode(nextMode)}
            >
              {nextMode === 'write' ? 'Write' : 'Preview'}
            </button>
          ))}
        </div>
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Markdown supported</span>
      </div>

      {mode === 'write' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write in Markdown..."
          className="field"
          style={{
            minHeight,
            border: 0,
            borderRadius: 0,
            resize: 'vertical',
            background: 'transparent',
          }}
        />
      ) : (
        <div
          className="markdown"
          style={{
            minHeight,
            padding: '1rem',
          }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {value}
            </ReactMarkdown>
          ) : (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
