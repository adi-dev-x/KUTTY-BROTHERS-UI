import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ServerUnreachableAlert from './components/ServerUnreachableAlert/ServerUnreachableAlert.jsx'
import { installServerStatusInterceptor } from './utils/serverStatusInterceptor.js'

installServerStatusInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ServerUnreachableAlert />
  </StrictMode>,
)
