import { useState, useEffect, useRef, useCallback } from 'react';
export function useDebounce(value, delay=400) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; } });
  const set = useCallback(v => { setValue(v); localStorage.setItem(key, JSON.stringify(v)); }, [key]);
  return [value, set];
}
export function useClickOutside(handler) {
  const ref = useRef(null);
  useEffect(() => {
    const listener = e => { if (ref.current && !ref.current.contains(e.target)) handler(e); };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [handler]);
  return ref;
}
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => { const h = () => setSize({ width: window.innerWidth, height: window.innerHeight }); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return size;
}
