import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { prompt } = await request.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3007',
      'X-Title': 'PHHS Hack Club',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5-20251001',
      messages: [
        {
          role: 'system',
          content:
            'You generate announcement modal content for PHHS Hack Club, a high school coding club website. ' +
            'Given a topic or idea, produce a short punchy heading (max 8 words) and a body (1-3 sentences, friendly and energetic). ' +
            'Respond with ONLY valid JSON in this shape: {"heading":"...","body":"..."}. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[modals/generate] OpenRouter error', res.status, text)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
  }

  const data = await res.json() as { choices: { message: { content: string } }[] }
  const content = data.choices?.[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(content) as { heading: string; body: string }
    return NextResponse.json({ heading: parsed.heading ?? '', body: parsed.body ?? '' })
  } catch {
    console.error('[modals/generate] Failed to parse AI response', content)
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
