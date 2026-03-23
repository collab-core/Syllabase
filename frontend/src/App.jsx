import { useState } from 'react'
import CourseSelector from './components/CourseSelector'
import MainChatArea from './components/MainChatArea'
import './App.css'

function App() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [messages, setMessages] = useState([])

  const handleNewChat = () => {
    setMessages([])
  }

  return (
    <div className="app">
      <div className="animated-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
        <canvas id="particles-canvas"></canvas>
      </div>
      
      <CourseSelector onSelectCourse={setSelectedCourse} selectedCourse={selectedCourse} />
      <MainChatArea selectedCourse={selectedCourse} messages={messages} setMessages={setMessages} onNewChat={handleNewChat} />
    </div>
  )
}

export default App
