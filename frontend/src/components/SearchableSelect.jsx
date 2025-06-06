import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  error = false,
  getOptionLabel = (option) => option.label || option.name || option,
  getOptionValue = (option) => option.value || option._id || option,
  renderOption = null,
  maxHeight = '200px',
  icon = null
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Find selected option
  const selectedOption = options.find(option => getOptionValue(option) === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSearchTerm('')
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, filteredOptions])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (option) => {
    onChange(getOptionValue(option))
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const toggleDropdown = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          relative w-full bg-white border rounded-lg shadow-sm py-3 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors
          ${className.includes('pl-10') ? 'pl-10 pr-10' : 'pl-3 pr-10'}
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
      >
        <span className="block truncate">
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Search Input */}
          <div className="sticky top-0 bg-white px-3 py-2 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cadd-red focus:border-cadd-red sm:text-sm"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setHighlightedIndex(-1)
                }}
              />
            </div>
          </div>

          {/* Options List */}
          <div style={{ maxHeight }} className="overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={getOptionValue(option)}
                  type="button"
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors
                    ${highlightedIndex === index ? 'bg-gray-100' : ''}
                    ${getOptionValue(option) === value ? 'bg-cadd-red text-white hover:bg-cadd-red' : 'text-gray-900'}
                  `}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
