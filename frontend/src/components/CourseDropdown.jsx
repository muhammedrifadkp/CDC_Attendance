import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const CourseDropdown = ({
  courses = [],
  value = '',
  onChange,
  placeholder = 'Select a course',
  disabled = false,
  error = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Ensure courses is an array and find selected course
  const coursesArray = Array.isArray(courses) ? courses : []
  const selectedCourse = coursesArray.find(course => course._id === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (courseId) => {
    onChange(courseId)
    setIsOpen(false)
  }

  const toggleDropdown = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          relative w-full bg-white border rounded-lg shadow-sm pl-10 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
      >
        <span className="block truncate">
          {selectedCourse ? `${selectedCourse.name} (${selectedCourse.department?.name})` : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {/* Options List with Fixed Height and Scroll */}
          <div 
            className="overflow-y-auto"
            style={{ 
              maxHeight: '240px' // Fixed height that will definitely show scroll
            }}
          >
            {coursesArray.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No courses available
              </div>
            ) : (
              <>
                {/* Empty option */}
                <button
                  type="button"
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors
                    ${!value ? 'bg-cadd-red text-white hover:bg-cadd-red' : 'text-gray-900'}
                  `}
                  onClick={() => handleSelect('')}
                >
                  {placeholder}
                </button>
                
                {/* Course options */}
                {coursesArray.map((course) => (
                  <button
                    key={course._id}
                    type="button"
                    className={`
                      w-full text-left px-3 py-3 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0
                      ${course._id === value ? 'bg-cadd-red text-white hover:bg-cadd-red' : 'text-gray-900'}
                    `}
                    onClick={() => handleSelect(course._id)}
                  >
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className={`text-xs mt-1 ${course._id === value ? 'text-white/80' : 'text-gray-500'}`}>
                        {course.code} • {course.department?.name}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDropdown
