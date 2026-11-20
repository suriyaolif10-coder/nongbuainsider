import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppStateProvider } from './state.jsx'
import './index.css'

// ไม่ใช้ StrictMode เพื่อไม่ให้นับยอดวิวโฆษณาซ้ำตอน dev
ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </HashRouter>,
)
