# TaskFlow Pro → AI Productivity Intelligence Platform

Summary of everything added/changed. Nothing existing was removed; all current
routes and components still work as before.

## Pre-existing bug fixed
`backend/src/db/migrate.js` created `tasks.owner_id` / `tasks.deadline`, but
every controller queried `tasks.user_id` / `tasks.due_date` — the app could
not have worked against a fresh database. `migrate.js` now auto-renames the
columns if the old names are present. The API still outputs the field as
`deadline` (aliased in `TASK_SELECT`) so no frontend component needed touching
for this — `TaskModal`, `TaskCard`, `Calendar`, `Tasks`, `Dashboard`, and
`helpers.js` all keep using `task.deadline` untouched. `taskController.js`
now accepts either `deadline` or `due_date` in request bodies.

## Database (`backend/src/db/migrate.js`)
Re-run `node src/db/migrate.js` (or your normal migration step) to apply:
- `tasks`: `estimated_hours`, `actual_hours`, `completion_percentage`,
  `risk_score`, `risk_level`, `risk_reason`, `risk_updated_at`,
  `scheduled_start`, `scheduled_end`
- `users`: `daily_available_hours`, `preferred_work_start`,
  `preferred_work_end`, `average_productivity_score`
- new table `workload_history` (one row per user per day)

## Backend
**New files**
- `services/groqClient.js` — shared Groq wrapper, `callGroqJSON` degrades to
  a rule-based fallback instead of 500ing if the AI response is malformed.
- `services/workloadService.js` — Feature 1, AI Workload Predictor
- `services/schedulerService.js` — Feature 2, AI Smart Scheduler
- `services/riskService.js` — Feature 3, Deadline Risk Prediction
- `services/productivityService.js` — Feature 4, Productivity Dashboard
- `controllers/intelligenceController.js` — wires the four services to the
  5 requested endpoints

**Modified files**
- `routes/index.js` — added the 5 new routes (all behind existing `auth`
  middleware)
- `controllers/taskController.js` — `TASK_SELECT` now returns the new
  workload/risk columns; `create`/`update` accept `estimated_hours`,
  `actual_hours`, `completion_percentage`; `deadline`/`due_date` alias fix
- `controllers/userController.js` — `updateMe` accepts
  `daily_available_hours`, `preferred_work_start`, `preferred_work_end`
- `middleware/auth.js` — `req.user` now includes the scheduling fields so
  the frontend can seed forms without an extra request

**New REST endpoints** (all `auth`-protected, same pattern as existing ones)
```
POST /api/ai/workload-analysis   → run today's workload analysis, persists workload_history
POST /api/ai/generate-schedule   → { persist?: boolean } chronological schedule for today
GET  /api/ai/deadline-risk       → risk-scores every open task, persists to tasks table
GET  /api/analytics/productivity → weekly/completion/day/hour metrics + AI insights
GET  /api/dashboard/overview     → aggregate of workload + top risks + stats (for future use)
```

## Frontend
**New files**
- `components/dashboard/WorkloadCard.jsx` — meter, overload warning,
  postponable-task list, AI explanation
- `components/dashboard/SmartScheduleCard.jsx` — chronological timeline with
  breaks, AI summary/notes
- `components/dashboard/RiskBadge.jsx` — reuses existing `.badge-*` CSS

**Modified files**
- `api/taskAPI.js` — added `ai.workloadAnalysis`, `ai.generateSchedule`,
  `ai.deadlineRisk`, `productivity`, `dashboardOverview`
- `pages/Dashboard.jsx` — renders `WorkloadCard` + `SmartScheduleCard` above
  the existing charts
- `pages/Analytics.jsx` — new "Productivity Intelligence" section (weekly
  completion rate, avg completion time, most productive day/hour, AI
  insights) above the existing Task Trends chart
- `pages/Profile.jsx` — new "AI Planning Preferences" card to edit
  `daily_available_hours` / `preferred_work_start` / `preferred_work_end`
- `components/kanban/TaskCard.jsx` — shows a `RiskBadge` when a task has
  medium/high deadline risk

## Not yet done
- No automated tests were added (repo didn't have a test setup to extend).

## Final pass (this update)
- `pages/Profile.jsx` — added an "AI Planning Preferences" card
  (`daily_available_hours`, `preferred_work_start`, `preferred_work_end`)
- `components/modals/TaskModal.jsx` — task create/edit form now has an
  **Estimated hours** input (feeds the Workload Predictor & Scheduler
  directly) and, when editing, a **Progress %** slider
  (`completion_percentage`) — both already accepted by
  `taskController.js`, just not exposed in the UI before
- `controllers/intelligenceController.js` — `GET /api/dashboard/overview`
  is now actually consumed: it also *computes* fresh risk scores (calls
  `riskService.assessDeadlineRisk`) rather than reading whatever was last
  persisted, so it's never stale
- **New** `components/dashboard/TopRisksCard.jsx` — added to `Dashboard.jsx`
  as a third card next to Workload/Scheduler; lists the highest-risk open
  tasks with a `RiskBadge`, click-through opens the existing `TaskModal`
- `services/riskService.js` — risk results now carry `due_date` through so
  the dashboard card can show it
- All new/modified backend files re-verified with `node --check`; all
  new/modified frontend files re-verified with a real Babel/JSX compile
  (not just brace-counting) — everything passes

