
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {
    console.error("Erro crítico ao renderizar React:", e);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Erro ao iniciar React: ${e instanceof Error ? e.message : 'Desconhecido'}</div>`;
  }
} else {
  console.error("Elemento #root não encontrado no DOM.");
}
