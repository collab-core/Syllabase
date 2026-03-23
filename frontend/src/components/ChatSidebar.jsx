import { useState, useEffect } from 'react'
import { getSelections, getCourses } from '../api'

export default function ChatSidebar({ onSelectChat, chats, activeContext }) {
  const [showNewChat, setShowNewChat] = useState(false)
  const [selections, setSelections] = useState({ programmes: [], semesters: [], regulation_years: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedProgramme, setSelectedProgramme] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedRegYear, setSelectedRegYear] = useState(null)
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)

  // Load selections on mount
  useEffect(() => {
    getSelections()
      .then(data => {
        setSelections(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load selections:', err)
        setError('Failed to load data')
        setLoading(false)
      })
  }, [])

  // Load courses when programme, semester, and reg year are selected
  useEffect(() => {
    if (!selectedProgramme || selectedSemester === null || selectedRegYear === null) {
      setCourses([])
      return
    }

    setCoursesLoading(true)
    getCourses(selectedProgramme.id, selectedSemester, selectedRegYear)
      .then(data => {
        setCourses(data)
        setCoursesLoading(false)
      })
      .catch(err => {
        console.error('Failed to load courses:', err)
        setCourses([])
        setCoursesLoading(false)
      })
  }, [selectedProgramme, selectedSemester, selectedRegYear])

  const handleStartChat = (course) => {
    const context = {
      programme: selectedProgramme,
      semester: selectedSemester,
      regulationYear: selectedRegYear,
      course: course
    }
    onSelectChat(context)
    setShowNewChat(false)
    setSelectedProgramme(null)
    setSelectedSemester(null)
    setSelectedRegYear(null)
    setCourses([])
  }

  const filteredChats = chats.filter(chat =>
    chat.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.courseCode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo">📚</div>
          <div className="logo-text">
            <h1>Syllabase</h1>
            <p>Course-aware AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Chats Section */}
      <div className="chats-section">
        <h2>Chats</h2>
        
        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* New Chat Button */}
        <button
          className={`new-chat-btn ${showNewChat ? 'active' : ''}`}
          onClick={() => setShowNewChat(!showNewChat)}
        >
          + New chat
        </button>

        {/* New Chat Panel */}
        {showNewChat && (
          <div className="new-chat-panel">
            <div className="selection-group">
              <label>Programme</label>
              <select
                value={selectedProgramme?.id || ''}
                onChange={(e) => {
                  const prog = selections.programmes.find(p => p.id === e.target.value)
                  setSelectedProgramme(prog || null)
                  setSelectedSemester(null)
                  setSelectedRegYear(null)
                  setCourses([])
                }}
                className="select-input"
              >
                <option value="">Select programme</option>
                {selections.programmes.map(prog => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProgramme && (
              <div className="selection-group">
                <label>Semester</label>
                <select
                  value={selectedSemester ?? ''}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value ? parseInt(e.target.value) : null)
                    setSelectedRegYear(null)
                    setCourses([])
                  }}
                  className="select-input"
                >
                  <option value="">Select semester</option>
                  {selections.semesters.map(sem => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSemester !== null && (
              <div className="selection-group">
                <label>Regulation Year</label>
                <select
                  value={selectedRegYear ?? ''}
                  onChange={(e) => {
                    setSelectedRegYear(e.target.value ? parseInt(e.target.value) : null)
                    setCourses([])
                  }}
                  className="select-input"
                >
                  <option value="">Select year</option>
                  {selections.regulation_years.map(year => (
                    <option key={year} value={year}>
                      Reg {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedRegYear !== null && (
              <div className="selection-group">
                <label>Course</label>
                {coursesLoading ? (
                  <div className="loading-text">Loading courses...</div>
                ) : courses.length === 0 ? (
                  <div className="no-courses-text">No courses found</div>
                ) : (
                  <div className="courses-list">
                    {courses.map(course => (
                      <button
                        key={course.id}
                        className="course-option"
                        onClick={() => handleStartChat(course)}
                      >
                        <span className="course-code">{course.code}</span>
                        <span className="course-name">{course.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat History List */}
        <div className="chats-list">
          {filteredChats.length === 0 ? (
            <div className="no-chats-text">
              {chats.length === 0 ? 'No chats yet' : 'No matching chats'}
            </div>
          ) : (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                className={`chat-item ${activeContext?.course?.id === chat.courseId ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.context)}
              >
                <div className="chat-title">{chat.courseName || 'Untitled'}</div>
                <div className="chat-time">{chat.timestamp}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="clear-history-btn">⚙️ Clear history</button>
      </div>
    </div>
  )
}
