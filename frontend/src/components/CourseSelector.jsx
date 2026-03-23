import { useState, useEffect } from 'react'
import { getSelections, getCourses } from '../api'

export default function CourseSelector({ onSelectCourse, selectedCourse }) {
  const [step, setStep] = useState('programme') // 'programme', 'semester', 'regYear', 'course'
  const [selections, setSelections] = useState({ programmes: [], semesters: [], regulation_years: [] })
  const [loading, setLoading] = useState(false)
  
  const [selectedProgramme, setSelectedProgramme] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedRegYear, setSelectedRegYear] = useState(null)
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)

  // Load selections on mount
  useEffect(() => {
    setLoading(true)
    getSelections()
      .then(data => {
        setSelections(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load selections:', err)
        setLoading(false)
      })
  }, [])

  // Load courses when all selections are made
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

  const programmes = selections.programmes || []
  const semesters = selections.semesters || []
  const regulationYears = selections.regulation_years || []

  const handleProgrammeSelect = (programme) => {
    const programmeObj = programmes.find(p => p.id === programme)
    setSelectedProgramme(programmeObj)
    setSelectedSemester(null)
    setSelectedRegYear(null)
    setStep('semester')
  }

  const handleSemesterSelect = (semester) => {
    setSelectedSemester(semester)
    setSelectedRegYear(null)
    setStep('regYear')
  }

  const handleRegYearSelect = (year) => {
    setSelectedRegYear(year)
    setStep('course')
  }

  const handleCourseSelect = (course) => {
    onSelectCourse({
      id: course.id,
      name: course.name,
      code: course.code,
      programme: selectedProgramme,
      semester: selectedSemester,
      regulationYear: selectedRegYear
    })
  }

  const handleBack = () => {
    if (step === 'semester') {
      setSelectedProgramme(null)
      setSelectedSemester(null)
      setSelectedRegYear(null)
      setStep('programme')
    } else if (step === 'regYear') {
      setSelectedSemester(null)
      setSelectedRegYear(null)
      setStep('semester')
    } else if (step === 'course') {
      setSelectedRegYear(null)
      setStep('regYear')
    }
  }

  if (loading) {
    return <div className="course-selector"><div className="loading-state">Loading...</div></div>
  }

  return (
    <div className="course-selector">
      <div className="selector-content">
        {/* Programme Selection */}
        {step === 'programme' && (
          <div className="selection-step">
            <h3>Select Course</h3>
            <div className="course-pills">
              {programmes.map(programme => (
                <button
                  key={programme.id}
                  className={`course-pill ${programme.id} ${selectedProgramme?.id === programme.id ? 'active' : ''}`}
                  onClick={() => handleProgrammeSelect(programme.id)}
                >
                  <span className="pill-content">{programme.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Semester Selection */}
        {step === 'semester' && (
          <div className="selection-step">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <h3>Select Semester</h3>
            <div className="selection-buttons">
              {semesters.map(sem => (
                <button
                  key={sem}
                  className={`selection-button ${selectedSemester === sem ? 'active' : ''}`}
                  onClick={() => handleSemesterSelect(sem)}
                >
                  Semester {sem}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Regulation Year Selection */}
        {step === 'regYear' && (
          <div className="selection-step">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <h3>Select Regulation Year</h3>
            <div className="selection-buttons">
              {regulationYears.map(year => (
                <button
                  key={year}
                  className={`selection-button ${selectedRegYear === year ? 'active' : ''}`}
                  onClick={() => handleRegYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Course Selection */}
        {step === 'course' && (
          <div className="selection-step">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <h3>Select Course</h3>
            {coursesLoading ? (
              <div className="loading-state">Loading courses...</div>
            ) : courses.length > 0 ? (
              <div className="courses-grid">
                {courses.map(course => (
                  <button
                    key={course.id}
                    className={`course-button ${selectedCourse?.id === course.id ? 'active' : ''}`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="course-code">{course.code}</div>
                    <div className="course-name">{course.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-data">No courses found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

