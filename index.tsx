
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("Iniciando montagem do React...");

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React renderizado com sucesso no elemento #root");
  } catch (e) {
    console.error("Erro crítico ao renderizar React:", e);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: #b91c1c; background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; margin: 20px; font-family: sans-serif;">
        <h2 style="margin-top: 0;">Falha ao Iniciar Aplicação</h2>
        <p>Ocorreu um erro técnico ao montar os componentes do React.</p>
        <pre style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; overflow: auto;">${e instanceof Error ? e.stack : 'Erro desconhecido'}</pre>
        <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Tentar Novamente</button>
      </div>
    `;
  }
} else {
  console.error("ERRO: Elemento #root não encontrado no documento HTML.");
}
