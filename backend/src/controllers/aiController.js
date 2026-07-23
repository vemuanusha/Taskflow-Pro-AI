require('dotenv').config();
const Groq = require('groq-sdk');
const pool = require('../db/pool');

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY not found in .env');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_MODEL = 'llama-3.1-8b-instant';

async function callGroq(systemPrompt, userMessage) {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  }
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return completion.choices[0]?.message?.content || '';
}

exports.suggestPriority = async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });
  try {
    const text = await callGroq(
      `You are a smart task prioritization assistant. Analyse a task and respond ONLY with valid JSON in this exact format:
{"priority":"high"|"medium"|"low","reason":"one sentence explanation","suggested_deadline_days":number_or_null}
No extra text, no markdown, just the JSON object.`,
      `Task title: ${title}\nDescription: ${description}`
    );
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('AI suggest-priority error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.breakdown = async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });
  try {
    const text = await callGroq(
      `You are a project planning assistant. Break a task into actionable subtasks.
Respond ONLY with valid JSON:
{"subtasks":["step 1","step 2",...],"estimated_hours":number,"notes":"optional short tip"}
No markdown, no extra text.`,
      `Task: ${title}\nDetails: ${description}`
    );
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('AI breakdown error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.improveDescription = async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });
  try {
    const text = await callGroq(
      `You are a technical writing assistant. Improve a task description to be clear and actionable.
Respond ONLY with valid JSON:
{"improved_description":"the better description","changes_made":"brief summary of what you improved"}
No markdown, no extra text.`,
      `Title: ${title}\nCurrent description: ${description || '(empty)'}`
    );
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('AI improve-description error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.dailySummary = async (req, res) => {
  try {
    const { rows: tasks } = await pool.query(
      `SELECT title, status, priority, due_date
       FROM tasks WHERE user_id=$1 AND status != 'done'
       ORDER BY priority, due_date NULLS LAST LIMIT 20`,
      [req.user.id]
    );
    if (!tasks.length) {
      return res.json({ summary: "You have no pending tasks. Great work! 🎉", focus_tasks: [], motivation: "Keep up the excellent pace!" });
    }
    const taskList = tasks.map(t =>
      `- "${t.title}" [${t.priority} priority, status: ${t.status}${t.due_date ? `, due: ${t.due_date.toISOString().slice(0,10)}` : ''}]`
    ).join('\n');
    const text = await callGroq(
      `You are a productivity coach. Analyse a user's pending tasks and give actionable daily guidance.
Respond ONLY with valid JSON:
{"summary":"2-3 sentence overview","focus_tasks":["task 1","task 2","task 3"],"motivation":"one encouraging sentence","warning":"overdue or urgent note or null"}
No markdown, no extra text.`,
      `Today's pending tasks:\n${taskList}`
    );
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('AI daily-summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.chat = async (req, res) => {
  const { message, context = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required.' });
  try {
    const { rows: tasks } = await pool.query(
      `SELECT title, status, priority, due_date
       FROM tasks WHERE user_id=$1 ORDER BY created_at DESC LIMIT 15`,
      [req.user.id]
    );
    const taskSnapshot = tasks.length
      ? tasks.map(t => `"${t.title}" [${t.status}, ${t.priority}${t.due_date ? `, due ${t.due_date.toISOString().slice(0,10)}` : ''}]`).join('\n')
      : '(no tasks yet)';

    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI task management assistant. The user's current tasks:\n${taskSnapshot}\n\nBe concise, practical, and friendly.`
      },
      ...context.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });

    res.json({ reply: completion.choices[0]?.message?.content || 'Sorry, I could not respond.' });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
};