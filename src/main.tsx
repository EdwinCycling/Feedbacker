import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './help-ai.css';
import './notebook.css';
import './importer.css';
import './wizard.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
