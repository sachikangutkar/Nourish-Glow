import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter false-positive info messages emitted by TensorFlow Lite / MediaPipe wasm to console.error
const origConsoleError = console.error;
console.error = (...args: any[]) => {
  const first = args[0];
  if (
    typeof first === 'string' &&
    (first.includes('INFO: Created TensorFlow Lite') ||
     first.includes('XNNPACK delegate') ||
     first.startsWith('INFO:'))
  ) {
    console.info(...args);
    return;
  }
  origConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
