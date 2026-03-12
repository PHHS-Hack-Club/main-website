'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export default function MarkdownPreview({ source, fallback = 'No content.' }: { source: string; fallback?: string }) {
  if (!source.trim()) {
    return <p style={{ color: 'var(--muted)', margin: 0 }}>{fallback}</p>
  }
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
