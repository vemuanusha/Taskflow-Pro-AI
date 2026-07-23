import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Task API
export const taskAPI = {
  getAll: (params = {}) => api.get("/api/tasks", { params }),
  get: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post("/api/tasks", data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  patch: (id, data) => api.patch(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),

  stats: () => api.get("/api/tasks/stats"),
  overdue: () => api.get("/api/tasks/overdue"),
  export: () =>
    api.get("/api/tasks/export", {
      responseType: "blob",
    }),

  move: (id, status) =>
    api.patch(`/api/tasks/${id}/move`, {
      status,
    }),

  // Projects
  getProjects: () => api.get("/api/projects"),
  createProject: (data) => api.post("/api/projects", data),
  updateProject: (id, data) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/api/projects/${id}`),

  // Comments
  getComments: (taskId) =>
    api.get(`/api/tasks/${taskId}/comments`),

  addComment: (taskId, data) =>
    api.post(`/api/tasks/${taskId}/comments`, data),

  deleteComment: (taskId, commentId) =>
    api.delete(`/api/tasks/${taskId}/comments/${commentId}`),

  // AI Features
  ai: {
    suggestPriority: (data) =>
      api.post("/api/ai/suggest-priority", data),

    breakdown: (data) =>
      api.post("/api/ai/breakdown", data),

    improveDescription: (data) =>
      api.post("/api/ai/improve-description", data),

    dailySummary: () =>
      api.get("/api/ai/daily-summary"),

    chat: (data) =>
      api.post("/api/ai/chat", data),

    workloadAnalysis: () =>
      api.post("/api/ai/workload-analysis"),

    generateSchedule: (persist = false) =>
      api.post("/api/ai/generate-schedule", {
        persist,
      }),

    deadlineRisk: () =>
      api.get("/api/ai/deadline-risk"),
  },

  // Analytics
  productivity: () =>
    api.get("/api/analytics/productivity"),

  dashboardOverview: () =>
    api.get("/api/dashboard/overview"),
};

export default api;