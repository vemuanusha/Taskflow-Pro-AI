# TaskFlow Pro AI

A full-stack task management application built with **React**, **Node.js**, **Express.js**, **MongoDB**, and **Groq AI (Llama 3.3 70B)**.

---

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 18, React Router, Recharts, Axios |
| Backend  | Node.js, Express.js                     |
| Database | MongoDB + Mongoose                      |
| Auth     | JWT (access + refresh tokens)           |
| AI       | Groq API (Llama 3.3 70B Versatile)      |

---

## AI Features

| Feature               | How to use                                         |
| --------------------- | -------------------------------------------------- |
| 🎯 Suggest Priority   | In task modal → click **"🎯 AI"** next to Priority |
| ✨ Improve Description | In task modal → click **"✨ AI Improve"**           |
| 🔧 Task Breakdown     | Topbar → 🤖 AI → Breakdown tab                     |
| 📊 Daily Summary      | Topbar → 🤖 AI → Daily Summary tab                 |
| 💬 AI Chat            | Topbar → 🤖 AI → Chat tab                          |

> **Note:** AI features require a `GROQ_API_KEY` in the backend `.env` file.

Get a free API key from:

https://console.groq.com/keys

---

## Prerequisites

* Node.js v18+
* MongoDB 6+
* MongoDB Atlas account or local MongoDB
* npm

---

## Setup Instructions

### 1. Clone / Extract the Project

```text
taskflow-pro/
├── backend/
└── frontend/
```

---

### 2. Set Up MongoDB

You can use either:

* **MongoDB Atlas** — recommended for deployment
* **Local MongoDB** — recommended for local development

For MongoDB Atlas, create a cluster and database user, then copy your MongoDB connection string.

Example:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflowpro
```

---

### 3. Configure the Backend

Go to the backend folder:

```bash
cd backend
```

Create a `.env` file:

```env
PORT=5000

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflowpro

JWT_SECRET=any-long-random-string-here
JWT_REFRESH_SECRET=another-long-random-string

GROQ_API_KEY=your_groq_api_key_here

CLIENT_URL=http://localhost:3000
```

### Environment Variables

| Variable             | Purpose                   |
| -------------------- | ------------------------- |
| `PORT`               | Backend server port       |
| `MONGODB_URI`        | MongoDB connection string |
| `JWT_SECRET`         | Secret for access tokens  |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `GROQ_API_KEY`       | Groq AI API key           |
| `CLIENT_URL`         | Frontend URL              |

Get your Groq API key from:

https://console.groq.com/keys

---

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

The backend uses **Mongoose** to connect Node.js with MongoDB.

If Mongoose is not already installed:

```bash
npm install mongoose
```

---

### 5. Start the Backend Server

For development:

```bash
npm run dev
```

Or:

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

Health Check:

```text
http://localhost:5000/health
```

Expected output:

```text
TaskFlow Pro AI backend running on port 5000
MongoDB connected successfully
```

---

### 6. Configure and Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Frontend:

```text
http://localhost:3000
```

---

## MongoDB Database Structure

The application uses MongoDB collections instead of PostgreSQL tables.

Main collections:

```text
taskflowpro
│
├── users
├── tasks
├── projects
├── comments
└── refreshTokens
```

### Users Collection

Stores registered users and authentication information.

Example:

```json
{
  "name": "Anusha",
  "email": "anusha@example.com",
  "password": "hashed-password"
}
```

### Tasks Collection

Stores user tasks.

Example:

```json
{
  "title": "Complete Backend API",
  "description": "Develop TaskFlow backend APIs",
  "priority": "High",
  "status": "In Progress",
  "dueDate": "2026-09-30",
  "userId": "ObjectId"
}
```

### Projects Collection

Stores projects created by users.

Example:

```json
{
  "name": "TaskFlow Pro",
  "description": "AI-powered task management application",
  "userId": "ObjectId"
}
```

### Comments Collection

Stores comments associated with tasks.

Example:

```json
{
  "taskId": "ObjectId",
  "userId": "ObjectId",
  "text": "Task is almost completed"
}
```

---

## Project Structure

```text
backend/
├── src/
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Project.js
│   │   ├── Comment.js
│   │   └── RefreshToken.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── taskController.js
│   │   ├── projectController.js
│   │   └── aiController.js
│   └── routes/
│       └── index.js
└── .env.example

frontend/
├── src/
│   ├── api/
│   │   └── taskAPI.js
│   ├── components/
│   │   ├── ai/
│   │   │   └── AIAssistant.jsx
│   │   ├── kanban/
│   │   ├── layout/
│   │   └── modals/
│   │       └── TaskModal.jsx
│   ├── context/
│   ├── pages/
│   └── styles/
│       └── global.css
└── .env.example
```

---

## API Endpoints

### Authentication

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

## MongoDB Connection

The backend connects to MongoDB using **Mongoose**.

Example:

```javascript
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
```

---

## Authentication

TaskFlow Pro AI uses **JWT authentication**.

The authentication system includes:

* User registration
* User login
* Access tokens
* Refresh tokens
* Protected API routes
* Password hashing
* User-specific tasks and projects

---

## AI Integration

TaskFlow Pro AI uses **Groq API** with:

```text
Model: Llama 3.3 70B Versatile
```

AI is used for:

* Task priority suggestions
* Task description improvement
* Task breakdown
* Daily productivity summaries
* AI-powered chat
* Task planning assistance

---

## Common Issues

### "GROQ_API_KEY not set"

Add your Groq API key to:

```text
backend/.env
```

Example:

```env
GROQ_API_KEY=your_actual_api_key
```

---

### MongoDB Connection Error

If you see:

```text
MongoServerSelectionError
```

Check:

1. MongoDB Atlas cluster is running.
2. MongoDB username and password are correct.
3. Your IP address is allowed in MongoDB Atlas Network Access.
4. `MONGODB_URI` is correctly added to `.env`.

Example:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflowpro
```

---

### "MONGODB_URI is undefined"

Make sure the `.env` file is inside:

```text
backend/.env
```

and contains:

```env
MONGODB_URI=your_mongodb_connection_string
```

Also make sure the backend loads environment variables using:

```javascript
require("dotenv").config();
```

---

### Port Already in Use

If port `5000` is already being used, change:

```env
PORT=5000
```

to:

```env
PORT=5001
```

T
