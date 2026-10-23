import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeProgress } from './study/store'

const root = createRoot(document.getElementById('root'))
async function start() {
  try {
    await initializeProgress()
    root.render(<StrictMode><App /></StrictMode>)
  } catch {
    root.render(<main className="page"><h1>could not open saved progress</h1>
      <p>your saved data has not been changed.</p>
      <button onClick={start}>retry</button></main>)
  }
}
start()
