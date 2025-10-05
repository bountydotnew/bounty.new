import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Check if authenticated from initial render
const isAuthenticated = rootElement.dataset.authenticated === 'true';

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App isAuthenticated={isAuthenticated} />
  </StrictMode>
);
