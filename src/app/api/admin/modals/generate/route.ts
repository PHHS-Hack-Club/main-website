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

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3007',
        'X-Title': 'PHHS Coding Club',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        messages: [
          {
            role: 'system',
            content:
              'You write announcement modal content for PHHS Coding Club — the Hack Club chapter at Pascack Hills High School in Montvale, New Jersey.\n\n' +
              'Background on Hack Club:\n' +
              'Hack Club is a global 501(c)(3) nonprofit (EIN: 81-2908499) network of over 1,000 student-led high school coding clubs, with 105,892+ teen members worldwide. ' +
              'The philosophy is "learn by building" — every meeting, members ship a real project. No lectures, no busy work, just making things. ' +
              'Hack Club runs programs like: Jackpot (code 65 hours, get invited to Las Vegas or choose your own prizes), Stasis (hardware hackathon in Austin TX), Fallout (hardware hackathon in Shenzhen), ' +
              'Sleepover (all-girls hackathon in Chicago), Hack Club: The Game (build projects then compete in a Manhattan scavenger hunt), Flavortown (earn cookies for projects, redeem for MacBooks/iPads/Raspberry Pis), ' +
              'Blueprint (design a hardware project, get up to $400 funded), Sprig (web-based JavaScript game editor, 7k+ makers), Blot (open source drawing machine), Boba Drops (build a site, get free boba), ' +
              'Nest (free Linux server for all Hack Clubbers), Workshops (100+ self-guided coding tutorials), and YSWS (You Ship We Ship — build something, get something shipped back). ' +
              'Hack Club has a global Slack with 2,160+ people online at any time, 109,985 daily messages, and 24,808 channels. ' +
              'They\'ve hosted AMAs with people like Sal Khan and George Hotz. HCB (Hack Club Bank) has raised $58M+ for student-run events. ' +
              'The culture is deeply hacker: open source, curious, late nights, wild ideas, and genuine excitement about building things. Very anti-corporate.\n\n' +
              'PHHS Coding Club is student-run, meets after school, and is part of this global network.\n\n' +
              'Your job: given a topic or prompt from a club admin, write a modal heading (punchy, max 8 words, no trailing punctuation) and a body (1-3 sentences, conversational and energetic, written like a fellow student — not a teacher or a brand). ' +
              'Respond with ONLY valid JSON: {"heading":"...","body":"..."}. No markdown, no explanation, no extra keys.',
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
      return NextResponse.json({ error: `AI generation failed (${res.status})` })
    }

    const data = await res.json() as { choices: { message: { content: string } }[] }
    const content = data.choices?.[0]?.message?.content ?? ''

    // strip markdown code fences if the model wraps the JSON
    const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const parsed = JSON.parse(cleaned) as { heading: string; body: string }
    return NextResponse.json({ heading: parsed.heading ?? '', body: parsed.body ?? '' })
  } catch (err) {
    console.error('[modals/generate] error', err)
    return NextResponse.json({ error: 'AI generation failed' })
  }
}
