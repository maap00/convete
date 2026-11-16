'use client';
import { useEffect } from 'react';
export function Reveal() {
 useEffect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); } }), { threshold: 0 });
  document.querySelectorAll('.section').forEach(section => { if (section.getBoundingClientRect().top > window.innerHeight) section.classList.add('reveal-pending'); observer.observe(section); });
  return () => { observer.disconnect(); document.querySelectorAll('.reveal-pending').forEach(section => section.classList.remove('reveal-pending')); };
 }, []);
 return null;
}
