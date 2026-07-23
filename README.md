# TaskFlow Pro

A full-stack task management application built with **React**, **Node.js**, **Express.js**, **PostgreSQL**, and **Groq AI (Llama 3.3 70B)**.

---

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 18, React Router, Recharts, Axios |
| Backend  | Node.js, Express.js                     |
| Database | PostgreSQL                              |
| Auth     | JWT (access + refresh tokens)           |
| AI       | Groq API (Llama 3.3 70B Versatile)      |

---

## AI Features

| Feature               | How to use                                     |
| --------------------- | ---------------------------------------------- |
| 🎯 Suggest Priority   | In task modal → click "🎯 AI" next to Priority |
| ✨ Improve Description | In task modal → click "✨ AI Improve"           |
| 🔧 Task Breakdown     | Topbar → 🤖 AI → Breakdown tab                 |
| 📊 Daily Summary      | Topbar → 🤖 AI → Daily Summary tab             |
| 💬 AI Chat            | Topbar → 🤖 AI → Chat tab                      |

> **Note:** AI features require a `GROQ_API_KEY` in the backend `.env` file.
> Get a free API key at **https://console.groq.com/keys**

---

## Prerequisites

* Node.js v18+
* PostgreSQL 14+
* npm

---

## Setup Instructions

### 1. Clone / Extract the project

```text
taskflow-pro/
├── backend/
└── frontend/
```

---

### 2. Set up PostgreSQL database

Open psql or pgAdmin and run:

```sql
CREATE DATABASE taskflow_pro;
```

---

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow_pro
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=any-long-random-string-here
JWT_REFRESH_SECRET=another-long-random-string
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:3000
```

Get your API key from:

https://console.groq.com/keys

---

### 4. Install backend dependencies and run migrations

```bash
cd backend
npm install
npm run migrate
```

---

### 5. Start the backend server

```bash
npm run dev
# or
npm start
```

Backend → http://localhost:5000

Health Check →

http://localhost:5000/health

---

### 6. Configure and start the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Frontend →

http://localhost:3000

---

## Project Structure

```text
backend/
├── src/
│   ├── server.js
│   ├── db/
│   │   ├── pool.js
│   │   └── migrate.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── taskController.js
│   │   ├── projectController.js
│   │   └── aiController.js        # All AI features (Groq)
│   └── routes/
│       └── index.js
└── .env.example

frontend/
├── src/
│   ├── api/taskAPI.js
│   ├── components/
│   │   ├── ai/AIAssistant.jsx
│   │   ├── kanban/
│   │   ├── layout/
│   │   └── modals/TaskModal.jsx
│   ├── context/
│   ├── pages/
│   └── styles/global.css
└── .env.example
```

---

## API Endpoints

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Tasks

```text
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/move
GET    /api/tasks/stats
GET    /api/tasks/overdue
GET    /api/tasks/export
```

### Projects

```text
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### Comments

```text
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
DELETE /api/tasks/:taskId/comments/:commentId
```

### AI

```text
POST /api/ai/suggest-priority
POST /api/ai/breakdown
POST /api/ai/improve-description
GET  /api/ai/daily-summary
POST /api/ai/chat
```

---

## Common Issues

**"GROQ_API_KEY not set"**

→ Add your Groq API key to `backend/.env`

**DB connection refused**

→ Ensure PostgreSQL is running and the credentials in `.env` are correct.

**Port already in use**

→ Change `PORT=5000` in `backend/.env` and update the frontend API URL if needed.

**CORS errors**

→ Ensure:

```env
CLIENT_URL=http://localhost:3000
```

matches your frontend URL.

---

## AI Model

* Provider: **Groq**
* Model: **Llama 3.3 70B Versatile**
* Free API Key: https://console.groq.com/keys
* Fast inference for chat, task prioritization, summaries, and planning.

  ##Live Demo
  
https://taskflow-frontend-qh6v.onrender.com
  
