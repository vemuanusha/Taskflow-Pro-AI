require('dotenv').config();
const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY not found in .env');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = 'llama-3.1-8b-instant';

/**
 * Calls Groq chat completions and returns the raw text.
 */
async function callGroq(systemPrompt, userMessage, opts = {}) {
  const completion = await groq.chat.completions.create({
    model: opts.model || GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 1024,
  });
  return completion.choices[0]?.message?.content || '';
}

/**
 * Calls Groq and parses the response as JSON, stripping markdown fences.
 * Falls back to `fallback` if parsing fails, so a flaky AI response never 500s a request.
 */
async function callGroqJSON(systemPrompt, userMessage, opts = {}, fallback = null) {
  try {
    const text = await callGroq(systemPrompt, userMessage, opts);
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Groq JSON parse/call error:', err.message);
    if (fallback !== null) return fallback;
    throw err;
  }
}

module.exports = { groq, GROQ_MODEL, callGroq, callGroqJSON };
