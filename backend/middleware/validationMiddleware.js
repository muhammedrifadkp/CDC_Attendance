/**
 * Comprehensive Input Validation and Sanitization Middleware
 * Provides security against XSS, injection attacks, and data validation
 */

const validator = require('validator');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitize input to prevent XSS attacks
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove XSS attempts
    let sanitized = xss(input, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
    
    // Additional sanitization
    sanitized = validator.escape(sanitized);
    return sanitized.trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!validator.isEmail(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }
  
  if (email.length > 254) {
    return { isValid: false, message: 'Email too long' };
  }
  
  return { isValid: true };
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password too long' };
  }
  
  // Check for at least one uppercase, lowercase, number, and special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate name fields
 */
const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: `${fieldName} must be at least 2 characters long` };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, message: `${fieldName} must be less than 50 characters` };
  }
  
  // Allow only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    return { isValid: false, message: `${fieldName} contains invalid characters` };
  }
  
  return { isValid: true, value: trimmedName };
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { isValid: false, message: 'Phone number must be between 10-15 digits' };
  }
  
  return { isValid: true, value: phone.trim() };
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  if (!validator.isMongoId(id)) {
    return { isValid: false, message: `Invalid ${fieldName} format` };
  }
  
  return { isValid: true };
};

/**
 * Validate date
 */
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, message: `Invalid ${fieldName} format` };
  }
  
  return { isValid: true, value: parsedDate };
};

/**
 * General input sanitization middleware
 */
const sanitizeInputs = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(400).json({
      message: 'Invalid input data',
      error: 'Input sanitization failed'
    });
  }
};

/**
 * MongoDB injection protection middleware
 */
const preventMongoInjection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential MongoDB injection attempt detected: ${key} in ${req.method} ${req.path}`);
  }
});

/**
 * User registration validation
 */
const validateUserRegistration = (req, res, next) => {
  const { name, email, password, phone, role } = req.body;
  const errors = [];
  
  // Validate name
  const nameValidation = validateName(name, 'Name');
  if (!nameValidation.isValid) {
    errors.push(nameValidation.message);
  }
  
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.message);
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message);
  }
  
  // Validate phone (optional)
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    }
  }
  
  // Validate role
  const validRoles = ['admin', 'teacher', 'lab-teacher'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role specified');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

/**
 * Teacher registration validation (no password required - auto-generated)
 */
const validateTeacherRegistration = (req, res, next) => {
  const { name, email, phone, department, role } = req.body;
  const errors = [];

  // Validate name
  const nameValidation = validateName(name, 'Name');
  if (!nameValidation.isValid) {
    errors.push(nameValidation.message);
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.message);
  }

  // Validate phone (optional)
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    }
  }

  // Validate department (required for teachers)
  if (!department) {
    errors.push('Department is required for teachers');
  } else {
    const deptValidation = validateObjectId(department, 'Department');
    if (!deptValidation.isValid) {
      errors.push(deptValidation.message);
    }
  }

  // Validate role
  const validRoles = ['teacher'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role specified for teacher registration');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Admin registration validation (no password required - auto-generated)
 */
const validateAdminRegistration = (req, res, next) => {
  const { name, email, phone, role } = req.body;
  const errors = [];

  // Validate name
  const nameValidation = validateName(name, 'Name');
  if (!nameValidation.isValid) {
    errors.push(nameValidation.message);
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.message);
  }

  // Validate phone (optional)
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    }
  }

  // Validate role (should be admin or not specified)
  const validRoles = ['admin'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role specified for admin registration');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Student registration validation
 */
const validateStudentRegistration = (req, res, next) => {
  console.log('🔍 VALIDATION DEBUG: Student validation started');
  console.log('🔍 VALIDATION DEBUG: Request body:', JSON.stringify(req.body, null, 2));

  const { name, email, studentId, rollNo, rollNumber, phone, department, course, batch } = req.body;
  const errors = [];

  console.log('🔍 VALIDATION DEBUG: Extracted fields:', {
    name, email, studentId, rollNo, rollNumber, phone, department, course, batch
  });

  // Validate name
  const nameValidation = validateName(name, 'Name');
  if (!nameValidation.isValid) {
    errors.push(nameValidation.message);
  }

  // Validate email (optional - only validate if provided)
  if (email && email.trim() !== '') {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.message);
    }
  }

  // Validate student ID/Roll Number (check for any of the possible field names)
  const rollNumberValue = studentId || rollNo || rollNumber;
  if (rollNumberValue && (typeof rollNumberValue !== 'string' || rollNumberValue.trim().length < 1)) {
    errors.push('Roll number must be at least 1 character long');
  }
  // Note: Roll number is not required as it can be auto-generated

  // Validate phone (optional - only validate if provided)
  if (phone && phone.trim() !== '') {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    }
  }
  
  // Validate ObjectIds
  if (department) {
    console.log('🔍 VALIDATION DEBUG: Validating department ObjectId:', department);
    const deptValidation = validateObjectId(department, 'Department');
    if (!deptValidation.isValid) {
      console.log('❌ VALIDATION DEBUG: Department validation failed:', deptValidation.message);
      errors.push(deptValidation.message);
    } else {
      console.log('✅ VALIDATION DEBUG: Department ObjectId is valid');
    }
  }

  if (course) {
    console.log('🔍 VALIDATION DEBUG: Validating course ObjectId:', course);
    const courseValidation = validateObjectId(course, 'Course');
    if (!courseValidation.isValid) {
      console.log('❌ VALIDATION DEBUG: Course validation failed:', courseValidation.message);
      errors.push(courseValidation.message);
    } else {
      console.log('✅ VALIDATION DEBUG: Course ObjectId is valid');
    }
  }

  if (batch) {
    console.log('🔍 VALIDATION DEBUG: Validating batch ObjectId:', batch);
    const batchValidation = validateObjectId(batch, 'Batch');
    if (!batchValidation.isValid) {
      console.log('❌ VALIDATION DEBUG: Batch validation failed:', batchValidation.message);
      errors.push(batchValidation.message);
    } else {
      console.log('✅ VALIDATION DEBUG: Batch ObjectId is valid');
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDATION DEBUG: Validation failed with errors:', errors);
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  console.log('✅ VALIDATION DEBUG: Validation passed, proceeding to controller');
  next();
};

/**
 * Attendance validation
 */
const validateAttendance = (req, res, next) => {
  const { student, batch, date, status } = req.body;
  const errors = [];
  
  // Validate student ID
  const studentValidation = validateObjectId(student, 'Student');
  if (!studentValidation.isValid) {
    errors.push(studentValidation.message);
  }
  
  // Validate batch ID
  const batchValidation = validateObjectId(batch, 'Batch');
  if (!batchValidation.isValid) {
    errors.push(batchValidation.message);
  }
  
  // Validate date
  const dateValidation = validateDate(date, 'Date');
  if (!dateValidation.isValid) {
    errors.push(dateValidation.message);
  }
  
  // Validate status
  const validStatuses = ['present', 'absent', 'late'];
  if (!status || !validStatuses.includes(status)) {
    errors.push('Status must be one of: present, absent, late');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeInputs,
  preventMongoInjection,
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateObjectId,
  validateDate,
  validateUserRegistration,
  validateTeacherRegistration,
  validateAdminRegistration,
  validateStudentRegistration,
  validateAttendance
};
