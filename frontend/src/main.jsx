// Redirect carreiras.patronos.org to centro.patronos.org (single domain)
if (window.location.hostname === 'carreiras.patronos.org') {
  window.location.replace(window.location.href.replace('carreiras.patronos.org', 'centro.patronos.org'));
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
