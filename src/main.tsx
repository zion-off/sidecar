import { ConfigProvider } from '@/context/ConfigContext';
import 'highlight.js/styles/vs2015.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import './index.css';

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.add(prefersDark ? 'dark' : 'light');

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(e.matches ? 'dark' : 'light');
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TooltipProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </TooltipProvider>
  </React.StrictMode>
);

export {};
