import { useState, useRef, useEffect } from 'react'
import { chatWithContext } from '../api'

export default function MainChatArea({ selectedCourse, messages, setMessages, onNewChat }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const suggestions = [
    'What can I ask you to do?',
    'Which one of my projects is performing the best?',
    'What projects should I be concerned about right now?'
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend() {
    const prompt = input.trim()
    if (!prompt || !selectedCourse || sending) return

    const userMsg = { id: Date.now(), role: 'user', content: prompt }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    try {
      // For now, send a simple message without API integration
      // The actual course context would be added when integrated with backend
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I'm an AI assistant for ${selectedCourse.label}. ${prompt}`,
      }
      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)
    } catch (err) {
      const errorMsg = { id: Date.now() + 1, role: 'error', content: err.message }
      setMessages([...newMessages, errorMsg])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSuggestion(suggestion) {
    setInput(suggestion)
  }

  const hasMessages = messages.length > 0
  const courseDisplay = selectedCourse ? `${selectedCourse.code} (${selectedCourse.programme?.name || 'Course'})` : null

  return (
    <main className="main-chat-area">
      {!hasMessages ? (
        <div className="welcome-section">
          <div className="sparkle-icon">✨</div>
          <h1 className="welcome-title">Ask Supabase anything</h1>
          
          {selectedCourse && (
            <div className="selected-course-info">
              <span className="course-badge">{courseDisplay}</span>
            </div>
          )}
          
          <div className="suggestions-container">
            <p className="suggestions-label">Suggestions on what to ask Our AI</p>
            <div className="suggestion-chips">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="messages-container">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              {msg.role === 'user' && (
                <div className="bubble user-bubble">{msg.content}</div>
              )}
              {msg.role === 'assistant' && (
                <div className="bubble assistant-bubble">{msg.content}</div>
              )}
              {msg.role === 'error' && (
                <div className="bubble error-bubble">⚠️ {msg.content}</div>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="message assistant">
              <div className="bubble assistant-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="input-wrapper">
        <div className="input-container">
          <textarea
            placeholder={selectedCourse ? `Ask me about ${selectedCourse.code}...` : 'Select a course to start...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedCourse || sending}
            rows={1}
            className="chat-input"
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!selectedCourse || !input.trim() || sending}
          >
            {sending ? (
              <span className="spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
