import { useState, useRef, useEffect } from 'react'
import { chatWithContext } from '../api'

const STORAGE_KEY_PREFIX = 'syllabase_chat_'

function getStorageKey(courseId) {
  return `${STORAGE_KEY_PREFIX}${courseId}`
}

function loadChatFromStorage(courseId) {
  if (!courseId) return []
  try {
    const stored = localStorage.getItem(getStorageKey(courseId))
    return stored ? JSON.parse(stored) : []
  } catch (err) {
    console.error('Failed to load chat from storage:', err)
    return []
  }
}

function saveChatToStorage(courseId, messages) {
  if (!courseId) return
  try {
    localStorage.setItem(getStorageKey(courseId), JSON.stringify(messages))
  } catch (err) {
    console.error('Failed to save chat to storage:', err)
  }
}

function clearChatFromStorage(courseId) {
  if (!courseId) return
  try {
    localStorage.removeItem(getStorageKey(courseId))
  } catch (err) {
    console.error('Failed to clear chat from storage:', err)
  }
}

export default function ChatInterface({ activeContext, onNewChat }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Load chat from localStorage when course context changes
  useEffect(() => {
    if (activeContext?.course?.id) {
      const savedMessages = loadChatFromStorage(activeContext.course.id)
      setMessages(savedMessages)
    } else {
      setMessages([])
    }
    setInput('')
    setShowClearConfirm(false)
  }, [activeContext?.course?.id])

  async function handleSend() {
    const prompt = input.trim()
    if (!prompt || !activeContext || sending) return

    const userMsg = { id: Date.now(), role: 'user', content: prompt }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    // Build conversation history with sliding window (last 10 messages)
    const MAX_HISTORY_MESSAGES = 10
    const conversationHistory = newMessages
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.role === 'user' ? msg.content : (msg.content || '')
      }))

    try {
      const result = await chatWithContext(
        activeContext.programme.id,
        activeContext.semester,
        activeContext.regulationYear,
        activeContext.course.id,
        prompt,
        conversationHistory,
      )

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        relevant: result.relevant,
        reason: result.reason,
        content: result.relevant ? result.answer : null,
      }
      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)
      saveChatToStorage(activeContext.course.id, updatedMessages)

      // Add to chat history in sidebar
      const chatEntry = {
        id: `${activeContext.course.id}-${Date.now()}`,
        courseId: activeContext.course.id,
        courseName: activeContext.course.name,
        courseCode: activeContext.course.code,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', ''),
        context: activeContext
      }
      if (onNewChat) onNewChat(chatEntry)
    } catch (err) {
      const errorMsg = { id: Date.now() + 1, role: 'error', content: err.message }
      const updatedMessages = [...newMessages, errorMsg]
      setMessages(updatedMessages)
      saveChatToStorage(activeContext.course.id, updatedMessages)
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

  function handleClearChat() {
    clearChatFromStorage(activeContext.course.id)
    setMessages([])
    setShowClearConfirm(false)
  }

  const hasContext = !!activeContext

  return (
    <main className="chat-panel">
      <div className="chat-header">
        {hasContext ? (
          <>
            <div className="header-back">← Your assistant for the</div>
            <div className="header-course">
              {activeContext.course.code} (Reg. {activeContext.regulationYear})
            </div>
          </>
        ) : (
          <div className="no-context-hint">
            Select a course from the sidebar to start chatting
          </div>
        )}
      </div>

      <div className="messages-area">
        {messages.length === 0 && hasContext && (
          <div className="empty-state">
            <div className="assistant-welcome">
              <div className="welcome-avatar">AI</div>
              <div className="welcome-content">
                <h3>Syllabase AI</h3>
                <p className="welcome-greeting">Hello! How can I assist you today?</p>
                <ul className="welcome-suggestions">
                  <li>Ask any question related to your courses</li>
                  <li>Get assistance with study materials, exams, and assignments.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.role === 'user' && (
              <div className="bubble user-bubble">{msg.content}</div>
            )}

            {msg.role === 'assistant' && msg.relevant && (
              <div className="bubble assistant-bubble">{msg.content}</div>
            )}

            {msg.role === 'assistant' && !msg.relevant && (
              <div className="bubble irrelevant-bubble">
                <span className="irrelevant-icon">⚠️</span>
                <div>
                  <p className="irrelevant-title">Not within syllabus scope</p>
                  <p className="irrelevant-reason">{msg.reason}</p>
                </div>
              </div>
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

      <div className="input-area">
        <textarea
          placeholder={
            hasContext
              ? `Ask about ${activeContext.course.code}… (Enter to send, Shift+Enter for new line)`
              : 'Select a course from the sidebar to begin…'
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!hasContext || sending}
          rows={3}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!hasContext || !input.trim() || sending}
          aria-label="Send"
          title="Send message"
        >
          {sending ? (
            <span className="send-spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Clear Chat History?</h3>
            <p>This will delete all messages in this course. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={handleClearChat}>
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
