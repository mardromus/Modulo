/**
 * Groq LLM Client — Shared infrastructure for AI agent intelligence
 *
 * Uses Llama 3.3 70B via Groq for blazing-fast inference.
 * All agents use this to add natural-language reasoning on top of their algorithmic outputs.
 */

import Groq from 'groq-sdk'

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null

const MODEL = 'llama-3.3-70b-versatile'

/**
 * Send a prompt to Groq and get a text response.
 * Returns fallback text if GROQ_API_KEY is not set or if the call fails.
 */
export async function askGroq(
    systemPrompt: string,
    userMessage: string,
    fallback: string = 'AI analysis unavailable — add GROQ_API_KEY to enable.'
): Promise<string> {
    if (!groq) return fallback

    try {
        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 800,
        })

        return completion.choices[0]?.message?.content?.trim() || fallback
    } catch (error) {
        console.error('[Groq] LLM call failed:', error)
        return fallback
    }
}
