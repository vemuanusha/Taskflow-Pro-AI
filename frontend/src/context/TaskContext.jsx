import React, { createContext, useContext, useReducer, useCallback } from 'react';
import toast from 'react-hot-toast';
import { taskAPI } from '../api/taskAPI';
const TaskContext = createContext(null);
const init = { tasks: [], projects: [], loading: false, error: null, stats: null };
function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':  return { ...state, loading: action.payload };
    case 'SET_TASKS':    return { ...state, tasks: action.payload, loading: false };
    case 'SET_PROJECTS': return { ...state, projects: action.payload };
    case 'SET_STATS':    return { ...state, stats: action.payload };
    case 'ADD_TASK':     return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':  return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TASK':  return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'ADD_PROJECT':  return { ...state, projects: [...state.projects, action.payload] };
    default: return state;
  }
}
export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
  const fetchTasks = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const r = await taskAPI.getAll(params);
      dispatch({ type: 'SET_TASKS', payload: r.data.results || r.data });
    } catch { dispatch({ type: 'SET_LOADING', payload: false }); }
  }, []);
  const fetchProjects = useCallback(async () => {
    try { const r = await taskAPI.getProjects(); dispatch({ type: 'SET_PROJECTS', payload: r.data }); } catch {}
  }, []);
  const fetchStats = useCallback(async () => {
    try { const r = await taskAPI.stats(); dispatch({ type: 'SET_STATS', payload: r.data }); } catch {}
  }, []);
  const createTask = async (data) => {
    const r = await taskAPI.create(data);
    dispatch({ type: 'ADD_TASK', payload: r.data });
    toast.success('Task created! ✅'); return r.data;
  };
  const updateTask = async (id, data) => {
    const r = await taskAPI.update(id, data);
    dispatch({ type: 'UPDATE_TASK', payload: r.data });
    toast.success('Task updated!'); return r.data;
  };
  const patchTask = async (id, data) => {
    const r = await taskAPI.patch(id, data);
    dispatch({ type: 'UPDATE_TASK', payload: r.data }); return r.data;
  };
  const deleteTask = async (id) => {
    await taskAPI.delete(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
    toast.success('Task deleted.');
  };
  const createProject = async (data) => {
    const r = await taskAPI.createProject(data);
    dispatch({ type: 'ADD_PROJECT', payload: r.data });
    toast.success('Project created! 🎯'); return r.data;
  };
  return (
    <TaskContext.Provider value={{ ...state, fetchTasks, fetchProjects, fetchStats, createTask, updateTask, patchTask, deleteTask, createProject }}>
      {children}
    </TaskContext.Provider>
  );
}
export const useTask = () => useContext(TaskContext);
