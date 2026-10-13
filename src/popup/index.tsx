import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupApp } from './PopupApp';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <PopupApp />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
