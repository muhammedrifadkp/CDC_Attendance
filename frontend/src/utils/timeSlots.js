/**
 * Time Slots Configuration
 * Centralized configuration for all institute time slots
 * Used across classes, lab bookings, and scheduling
 */

// Institute standard time slots (5 slots only)
export const TIME_SLOTS = [
  {
    id: '09:00 AM - 10:30 AM',
    label: '09:00 AM - 10:30 AM',
    start: '09:00',
    end: '10:30',
    startTime24: '09:00',
    endTime24: '10:30',
    duration: 90, // minutes
    icon: '🌅',
    period: 'Morning'
  },
  {
    id: '10:30 AM - 12:00 PM',
    label: '10:30 AM - 12:00 PM',
    start: '10:30',
    end: '12:00',
    startTime24: '10:30',
    endTime24: '12:00',
    duration: 90, // minutes
    icon: '☀️',
    period: 'Morning'
  },
  {
    id: '12:00 PM - 01:30 PM',
    label: '12:00 PM - 01:30 PM',
    start: '12:00',
    end: '13:30',
    startTime24: '12:00',
    endTime24: '13:30',
    duration: 90, // minutes
    icon: '🌞',
    period: 'Afternoon'
  },
  {
    id: '02:00 PM - 03:30 PM',
    label: '02:00 PM - 03:30 PM',
    start: '14:00',
    end: '15:30',
    startTime24: '14:00',
    endTime24: '15:30',
    duration: 90, // minutes
    icon: '🌤️',
    period: 'Afternoon'
  },
  {
    id: '03:30 PM - 05:00 PM',
    label: '03:30 PM - 05:00 PM',
    start: '15:30',
    end: '17:00',
    startTime24: '15:30',
    endTime24: '17:00',
    duration: 90, // minutes
    icon: '🌇',
    period: 'Evening'
  }
]

// Simple array of time slot IDs for dropdowns
export const TIME_SLOT_OPTIONS = TIME_SLOTS.map(slot => slot.id)

// Time slots for batch timing (backend enum values)
export const BATCH_TIMING_OPTIONS = TIME_SLOT_OPTIONS

// Time slots for lab booking
export const LAB_TIME_SLOTS = TIME_SLOTS

// Time slots for clear booking modal
export const CLEAR_BOOKING_TIME_SLOTS = [
  { value: 'all', label: 'All Time Slots' },
  ...TIME_SLOTS.map(slot => ({
    value: slot.id,
    label: slot.label
  }))
]

/**
 * Get time slot by ID
 * @param {string} id - Time slot ID
 * @returns {Object|null} Time slot object or null if not found
 */
export const getTimeSlotById = (id) => {
  return TIME_SLOTS.find(slot => slot.id === id) || null
}

/**
 * Get time slot label by ID
 * @param {string} id - Time slot ID
 * @returns {string} Time slot label or the ID if not found
 */
export const getTimeSlotLabel = (id) => {
  const slot = getTimeSlotById(id)
  return slot ? slot.label : id
}

/**
 * Check if a time slot ID is valid
 * @param {string} id - Time slot ID
 * @returns {boolean} True if valid
 */
export const isValidTimeSlot = (id) => {
  return TIME_SLOTS.some(slot => slot.id === id)
}

/**
 * Get time slots by period
 * @param {string} period - 'Morning', 'Afternoon', or 'Evening'
 * @returns {Array} Array of time slots for the period
 */
export const getTimeSlotsByPeriod = (period) => {
  return TIME_SLOTS.filter(slot => slot.period === period)
}

/**
 * Get current time slot based on current time
 * @returns {Object|null} Current time slot or null if no slots available
 */
export const getCurrentTimeSlot = () => {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

  // First, check if current time falls within any active time slot
  for (const slot of TIME_SLOTS) {
    const [startHour, startMin] = slot.startTime24.split(':').map(Number)
    const [endHour, endMin] = slot.endTime24.split(':').map(Number)

    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (currentTime >= startTime && currentTime < endTime) {
      return slot
    }
  }

  // If no active slot found, handle special cases
  const firstSlot = TIME_SLOTS[0] // 09:00 AM - 10:30 AM
  const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1] // 03:30 PM - 05:00 PM

  const [firstStartHour, firstStartMin] = firstSlot.startTime24.split(':').map(Number)
  const [lastEndHour, lastEndMin] = lastSlot.endTime24.split(':').map(Number)

  const firstSlotStart = firstStartHour * 60 + firstStartMin // 09:00 = 540 minutes
  const lastSlotEnd = lastEndHour * 60 + lastEndMin // 17:00 = 1020 minutes

  // Case 1: After 05:00 PM - select the last slot (03:30 PM - 05:00 PM)
  if (currentTime >= lastSlotEnd) {
    return lastSlot
  }

  // Case 2: Before 09:00 AM (next day scenario) - select the first slot (09:00 AM - 10:30 AM)
  if (currentTime < firstSlotStart) {
    return firstSlot
  }

  // Fallback: return first slot if no other conditions match
  return firstSlot
}

/**
 * Get next time slot
 * @returns {Object|null} Next time slot or null if no more slots today
 */
export const getNextTimeSlot = () => {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  for (const slot of TIME_SLOTS) {
    const [startHour, startMin] = slot.startTime24.split(':').map(Number)
    const startTime = startHour * 60 + startMin

    if (currentTime < startTime) {
      return slot
    }
  }

  return null
}

/**
 * Get current time slot with detailed explanation for debugging
 * @returns {Object} Object containing slot and reason for selection
 */
export const getCurrentTimeSlotWithReason = () => {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  const timeStr = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`

  // Check if current time falls within any active time slot
  for (const slot of TIME_SLOTS) {
    const [startHour, startMin] = slot.startTime24.split(':').map(Number)
    const [endHour, endMin] = slot.endTime24.split(':').map(Number)

    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (currentTime >= startTime && currentTime < endTime) {
      return {
        slot,
        reason: `Current time ${timeStr} is within active slot ${slot.label}`,
        scenario: 'active'
      }
    }
  }

  const firstSlot = TIME_SLOTS[0]
  const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1]
  const [lastEndHour, lastEndMin] = lastSlot.endTime24.split(':').map(Number)
  const [firstStartHour, firstStartMin] = firstSlot.startTime24.split(':').map(Number)
  const lastSlotEnd = lastEndHour * 60 + lastEndMin
  const firstSlotStart = firstStartHour * 60 + firstStartMin

  if (currentTime >= lastSlotEnd) {
    return {
      slot: lastSlot,
      reason: `Current time ${timeStr} is after 05:00 PM, selecting last slot ${lastSlot.label}`,
      scenario: 'after-hours'
    }
  }

  if (currentTime < firstSlotStart) {
    return {
      slot: firstSlot,
      reason: `Current time ${timeStr} is before 09:00 AM, selecting first slot ${firstSlot.label}`,
      scenario: 'before-hours'
    }
  }

  return {
    slot: firstSlot,
    reason: `Fallback: selecting first slot ${firstSlot.label}`,
    scenario: 'fallback'
  }
}

/**
 * Format time slot for display
 * @param {string} timeSlotId - Time slot ID
 * @param {string} format - 'full', 'short', or 'time-only'
 * @returns {string} Formatted time slot
 */
export const formatTimeSlot = (timeSlotId, format = 'full') => {
  const slot = getTimeSlotById(timeSlotId)
  if (!slot) return timeSlotId
  
  switch (format) {
    case 'short':
      return `${slot.start} - ${slot.end}`
    case 'time-only':
      return `${slot.start}-${slot.end}`
    case 'full':
    default:
      return slot.label
  }
}

/**
 * Check if institute is currently open (within official hours)
 * Note: getCurrentTimeSlot() handles after-hours scenarios differently
 * @returns {boolean} True if institute is open during official hours
 */
export const isInstituteOpen = () => {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  // Institute is open from first slot start to last slot end
  const firstSlot = TIME_SLOTS[0]
  const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1]

  const [startHour, startMin] = firstSlot.startTime24.split(':').map(Number)
  const [endHour, endMin] = lastSlot.endTime24.split(':').map(Number)

  const openTime = startHour * 60 + startMin
  const closeTime = endHour * 60 + endMin

  return currentTime >= openTime && currentTime <= closeTime
}

// Export default configuration
export default {
  TIME_SLOTS,
  TIME_SLOT_OPTIONS,
  BATCH_TIMING_OPTIONS,
  LAB_TIME_SLOTS,
  CLEAR_BOOKING_TIME_SLOTS,
  getTimeSlotById,
  getTimeSlotLabel,
  isValidTimeSlot,
  getTimeSlotsByPeriod,
  getCurrentTimeSlot,
  getCurrentTimeSlotWithReason,
  getNextTimeSlot,
  formatTimeSlot,
  isInstituteOpen
}
