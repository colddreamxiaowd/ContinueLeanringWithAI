"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const saved = localStorage.getItem('learninghub.theme');
    const next = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('learninghub.theme', next);
  }

  return <button type="button" className="icon-button theme-toggle" aria-label={theme === 'light' ? '切换深色主题' : '切换浅色主题'} onClick={toggle}>
    {theme === 'light' ? <Moon size={18} aria-hidden="true"/> : <Sun size={18} aria-hidden="true"/>}
  </button>;
}
