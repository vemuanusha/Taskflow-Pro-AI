const pool = require('../db/pool');
const workloadService = require('../services/workloadService');
const schedulerService = require('../services/schedulerService');
const riskService = require('../services/riskService');
const productivityService = require('../services/productivityService');

// ── POST /api/ai/workload-analysis ─────────────────────────────────
exports.workloadAnalysis = async (req, res) => {
  try {
    const result = await workloadService.analyzeWorkload(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('workload-analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/ai/generate-schedule ─────────────────────────────────
exports.generateSchedule = async (req, res) => {
  try {
    const persist = req.body?.persist === true;
    const result = await schedulerService.generateSchedule(req.user.id, { persist });
    res.json(result);
  } catch (err) {
    console.error('generate-schedule error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/ai/deadline-risk ──────────────────────────────────────
exports.deadlineRisk = async (req, res) => {
  try {
    const results = await riskService.assessDeadlineRisk(req.user.id);
    res.json({
      count: results.length,
      high_risk: results.filter((r) => r.risk_level === 'high').length,
      medium_risk: results.filter((r) => r.risk_level === 'medium').length,
      low_risk: results.filter((r) => r.risk_level === 'low').length,
      results,
    });
  } catch (err) {
    console.error('deadline-risk error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/analytics/productivity ────────────────────────────────
exports.productivity = async (req, res) => {
  try {
    const metrics = await productivityService.getProductivityMetrics(req.user.id);
    const ai = await productivityService.generateInsights(metrics);
    res.json({ ...metrics, ai_insights: ai.insights || [] });
  } catch (err) {
    console.error('productivity analytics error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/dashboard/overview ────────────────────────────────────
// Single aggregate call the dashboard can use to avoid waterfalling requests.
exports.dashboardOverview = async (req, res) => {
  try {
    const uid = req.user.id;
    const [workload, riskResults, statsRes] = await Promise.all([
      workloadService.analyzeWorkload(uid),
      riskService.assessDeadlineRisk(uid), // scores + persists risk on every open task
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status='done') AS done,
                COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') AS overdue
         FROM tasks WHERE user_id=$1`,
        [uid]
      ),
    ]);

    const topRisks = riskResults
      .filter((r) => r.risk_level !== 'low')
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 5)
      .map((r) => ({ id: r.task_id, title: r.title, due_date: r.due_date, risk_score: r.risk_score, risk_level: r.risk_level, risk_reason: r.risk_reason }));

    res.json({
      workload,
      top_risks: topRisks,
      stats: {
        total: parseInt(statsRes.rows[0].total),
        done: parseInt(statsRes.rows[0].done),
        overdue: parseInt(statsRes.rows[0].overdue),
      },
    });
  } catch (err) {
    console.error('dashboard-overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
