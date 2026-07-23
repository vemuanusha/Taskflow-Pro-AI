const router = require('express').Router();
const auth   = require('../middleware/auth');

const authCtrl    = require('../controllers/authController');
const userCtrl    = require('../controllers/userController');
const taskCtrl    = require('../controllers/taskController');
const projCtrl    = require('../controllers/projectController');
const aiCtrl      = require('../controllers/aiController');
const intelCtrl   = require('../controllers/intelligenceController');

// ── Auth (public) ─────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login',    authCtrl.login);
router.post('/auth/refresh/', authCtrl.refresh);
router.post('/auth/logout',   authCtrl.logout);

// ── Users ─────────────────────────────────────────────────────────
router.get('/users/me',                  auth, userCtrl.me);
router.patch('/users/me/',               auth, userCtrl.updateMe);
router.post('/users/me/change-password', auth, userCtrl.changePassword);

// ── Tasks (order matters — specific before :id) ───────────────────
router.get ('/tasks/stats',    auth, taskCtrl.stats);
router.get ('/tasks/overdue',  auth, taskCtrl.overdue);
router.get ('/tasks/export',   auth, taskCtrl.exportCSV);
router.get ('/tasks',          auth, taskCtrl.list);
router.post('/tasks',          auth, taskCtrl.create);
router.get ('/tasks/:id',      auth, taskCtrl.get);
router.put ('/tasks/:id',      auth, taskCtrl.update);
router.patch('/tasks/:id',     auth, taskCtrl.patch);
router.delete('/tasks/:id',    auth, taskCtrl.remove);
router.patch('/tasks/:id/move',auth, taskCtrl.move);

// ── Task Comments ─────────────────────────────────────────────────
router.get   ('/tasks/:taskId/comments',          auth, projCtrl.listComments);
router.post  ('/tasks/:taskId/comments',          auth, projCtrl.addComment);
router.delete('/tasks/:taskId/comments/:commentId', auth, projCtrl.deleteComment);

// ── Projects ──────────────────────────────────────────────────────
router.get   ('/projects',     auth, projCtrl.listProjects);
router.post  ('/projects',     auth, projCtrl.createProject);
router.put   ('/projects/:id', auth, projCtrl.updateProject);
router.delete('/projects/:id', auth, projCtrl.deleteProject);

// ── AI Features ───────────────────────────────────────────────────
router.post('/ai/suggest-priority',      auth, aiCtrl.suggestPriority);
router.post('/ai/breakdown',             auth, aiCtrl.breakdown);
router.post('/ai/improve-description',   auth, aiCtrl.improveDescription);
router.get ('/ai/daily-summary',         auth, aiCtrl.dailySummary);
router.post('/ai/chat',                  auth, aiCtrl.chat);

// ── AI Productivity Intelligence ─────────────────────────────────
router.post('/ai/workload-analysis',     auth, intelCtrl.workloadAnalysis);
router.post('/ai/generate-schedule',     auth, intelCtrl.generateSchedule);
router.get ('/ai/deadline-risk',         auth, intelCtrl.deadlineRisk);

// ── Analytics / Dashboard ─────────────────────────────────────────
router.get ('/analytics/productivity',   auth, intelCtrl.productivity);
router.get ('/dashboard/overview',       auth, intelCtrl.dashboardOverview);

module.exports = router;
