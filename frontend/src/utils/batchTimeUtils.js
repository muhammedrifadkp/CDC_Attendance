// Utility functions for time-based batch filtering and status determination

/**
 * Parse time string (e.g., "09:00 AM") to minutes from midnight
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = (hours % 12) * 60 + minutes;
  if (period === 'PM') {
    totalMinutes += 12 * 60;
  }
  
  return totalMinutes;
};

/**
 * Parse batch timing string (e.g., "09:00 AM - 10:30 AM") to start and end minutes
 */
export const parseBatchTiming = (timing) => {
  if (!timing) return { start: 0, end: 0 };
  
  const [startTime, endTime] = timing.split(' - ');
  return {
    start: parseTimeToMinutes(startTime),
    end: parseTimeToMinutes(endTime)
  };
};

/**
 * Get current time in minutes from midnight
 */
export const getCurrentTimeInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/**
 * Format minutes to time string (e.g., 570 -> "09:30 AM")
 */
export const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
};

/**
 * Determine batch status based on current time
 */
export const getBatchStatus = (batch) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const { start, end } = parseBatchTiming(batch.timing);
  
  const bufferMinutes = 15; // 15 minutes buffer for "starting soon" and "recently ended"
  
  if (currentMinutes >= start && currentMinutes <= end) {
    return {
      status: 'active',
      label: 'Active Now',
      color: 'green',
      priority: 1
    };
  } else if (currentMinutes < start && currentMinutes >= start - bufferMinutes) {
    return {
      status: 'starting-soon',
      label: 'Starting Soon',
      color: 'yellow',
      priority: 2
    };
  } else if (currentMinutes > end && currentMinutes <= end + bufferMinutes) {
    return {
      status: 'recently-ended',
      label: 'Recently Ended',
      color: 'orange',
      priority: 3
    };
  } else if (currentMinutes < start) {
    return {
      status: 'upcoming',
      label: 'Upcoming',
      color: 'blue',
      priority: 4
    };
  } else {
    return {
      status: 'ended',
      label: 'Ended',
      color: 'gray',
      priority: 5
    };
  }
};

/**
 * Sort batches by priority (active first, then by time)
 */
export const sortBatchesByPriority = (batches) => {
  return batches.sort((a, b) => {
    const statusA = getBatchStatus(a);
    const statusB = getBatchStatus(b);
    
    // First sort by priority (active batches first)
    if (statusA.priority !== statusB.priority) {
      return statusA.priority - statusB.priority;
    }
    
    // Then sort by start time
    const timingA = parseBatchTiming(a.timing);
    const timingB = parseBatchTiming(b.timing);
    return timingA.start - timingB.start;
  });
};

/**
 * Get time until batch starts/ends
 */
export const getTimeUntilBatch = (batch) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const { start, end } = parseBatchTiming(batch.timing);
  const status = getBatchStatus(batch);
  
  if (status.status === 'active') {
    const minutesLeft = end - currentMinutes;
    if (minutesLeft > 60) {
      return `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`;
    } else {
      return `${minutesLeft}m left`;
    }
  } else if (status.status === 'starting-soon' || status.status === 'upcoming') {
    const minutesUntil = start - currentMinutes;
    if (minutesUntil > 60) {
      return `Starts in ${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`;
    } else {
      return `Starts in ${minutesUntil}m`;
    }
  } else if (status.status === 'recently-ended') {
    const minutesSince = currentMinutes - end;
    return `Ended ${minutesSince}m ago`;
  }
  
  return '';
};

/**
 * Get current time formatted for display
 */
export const getCurrentTimeFormatted = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Get current date formatted for display
 */
export const getCurrentDateFormatted = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Check if batch should show attendance marking option
 */
export const canMarkAttendance = (batch) => {
  const status = getBatchStatus(batch);
  return ['active', 'starting-soon', 'recently-ended'].includes(status.status);
};

/**
 * Get batches filtered by today's schedule
 */
export const getTodaysBatches = (batches) => {
  // For now, return all batches. In a more advanced system,
  // you might filter by day of week or specific date schedules
  return batches;
};

/**
 * Get priority message for batch based on status
 */
export const getBatchPriorityMessage = (batch) => {
  const status = getBatchStatus(batch);

  switch (status.status) {
    case 'active':
      return '🔴 Class in session - Mark attendance now!';
    case 'starting-soon':
      return '🟡 Class starting soon - Get ready!';
    case 'recently-ended':
      return '🟠 Just ended - Last chance to mark attendance';
    case 'upcoming':
      return '🔵 Upcoming class';
    default:
      return '⚪ Class ended';
  }
};

/**
 * Get current time slot based on real time
 */
export const getCurrentTimeSlot = (timeSlots) => {
  const currentMinutes = getCurrentTimeInMinutes();

  // Find the time slot that matches current time
  for (const slot of timeSlots) {
    const { start, end } = parseBatchTiming(slot.timing || slot.label);

    // Check if current time is within this slot (with 15 min buffer)
    if (currentMinutes >= start - 15 && currentMinutes <= end + 15) {
      return slot.id;
    }
  }

  // If no exact match, find the next upcoming slot
  for (const slot of timeSlots) {
    const { start } = parseBatchTiming(slot.timing || slot.label);
    if (currentMinutes < start) {
      return slot.id;
    }
  }

  // Default to first slot if no match found
  return timeSlots[0]?.id || null;
};

/**
 * Parse lab time slot format (e.g., "09:00 AM - 10:30 AM") to start and end minutes
 */
export const parseLabTimeSlot = (timeSlotLabel) => {
  if (!timeSlotLabel) return { start: 0, end: 0 };

  // Handle format like "09:00 AM - 10:30 AM"
  const parts = timeSlotLabel.split(' - ');
  if (parts.length === 2) {
    return {
      start: parseTimeToMinutes(parts[0]),
      end: parseTimeToMinutes(parts[1])
    };
  }

  return { start: 0, end: 0 };
};

/**
 * Get time slot status based on current time
 */
export const getTimeSlotStatus = (timeSlotLabel) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const { start, end } = parseLabTimeSlot(timeSlotLabel);

  const bufferMinutes = 15; // 15 minutes buffer

  if (currentMinutes >= start && currentMinutes <= end) {
    return {
      status: 'active',
      label: 'Active Now',
      color: 'green',
      priority: 1
    };
  } else if (currentMinutes < start && currentMinutes >= start - bufferMinutes) {
    return {
      status: 'starting-soon',
      label: 'Starting Soon',
      color: 'yellow',
      priority: 2
    };
  } else if (currentMinutes > end && currentMinutes <= end + bufferMinutes) {
    return {
      status: 'recently-ended',
      label: 'Recently Ended',
      color: 'orange',
      priority: 3
    };
  } else if (currentMinutes < start) {
    return {
      status: 'upcoming',
      label: 'Upcoming',
      color: 'blue',
      priority: 4
    };
  } else {
    return {
      status: 'ended',
      label: 'Ended',
      color: 'gray',
      priority: 5
    };
  }
};
