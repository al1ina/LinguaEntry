import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import { useNavigate } from 'react-router-dom'

function App() {
  // const [count, setCount] = useState(0)
  const navigate = useNavigate()
  
  const text = 
 `This website is designed to help users improve their language skills through 
  daily writing practice. Each time you write an entry about your day, it will save 
  your entry and an AI provides corrections and suggestions to help you sound more 
  like a native speaker.
                
  The AI also analyzes your past entries over time to identify patterns in your writing 
  and generate personalized tips such as commonly misused words or phrases you should 
  focus on.
                
  As of right now the platform only supports for English speakers learning Spanish with 
  plans to expand to more languages in the future.`
  return (
    <>
      <h1>Welcome!</h1> 
      <pre className="intro">{text}</pre>
      <button id="get-started" onClick={() => navigate('/entry')}>GET STARTED</button>
    </>
  )
}

export default App
