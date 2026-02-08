const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a random 6-digit access code
 */
const generateAccessCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a unique employee ID
 */
const generateEmployeeId = () => {
  return `emp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Generate a unique setup token for new employees
 */
const generateSetupToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Format phone number to E.164 format
 */
const formatPhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  if (!cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  
  return '+' + cleaned;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
const isValidPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Create a conversation ID between two users (FIXED VERSION)
 * 
 * IMPORTANT: This function MUST produce the same ID regardless of which user ID is passed first
 * Both users (owner and employee) must get the same conversation ID for real-time messaging to work
 * 
 * @param {string} userId1 - First user ID (could be owner or employee)
 * @param {string} userId2 - Second user ID (could be owner or employee)
 * @returns {string} - Consistent conversation ID (format: sorted_id1_sorted_id2)
 */
const createConversationId = (userId1, userId2) => {
  const id1 = String(userId1).trim();
  const id2 = String(userId2).trim();
  
  // Ensure phone numbers have + prefix
  const formatId = (id) => {
    if (id.includes('emp_')) return id;
    return id.startsWith('+') ? id : `+${id}`;
  };
  
  const formatted1 = formatId(id1);
  const formatted2 = formatId(id2);
  
  const ids = [formatted1, formatted2].sort();
  return `${ids[0]}_${ids[1]}`;
};

/**
 * Sanitize user input while preserving Vietnamese characters
 * FIXED: Now supports UTF-8 and Vietnamese diacritics (á, à, ả, ã, ạ, etc.)
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    // Only remove potential XSS characters, preserve Vietnamese diacritics
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .substring(0, 1000); // Limit to 1000 characters
};

/**
 * Generate a unique message ID
 */
const generateMessageId = () => {
  return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Format timestamp to readable format
 */
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('vi-VN'); // Vietnamese locale
};

/**
 * Check if access code has expired
 */
const isAccessCodeExpired = (createdAt, expiryMs = 600000) => {
  // Default expiry: 10 minutes (600000 ms)
  return Date.now() - createdAt > expiryMs;
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Verify password
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateAccessCode,
  generateEmployeeId,
  generateSetupToken,
  formatPhoneNumber,
  isValidEmail,
  isValidPhoneNumber,
  createConversationId,
  sanitizeInput,
  generateMessageId,
  formatTimestamp,
  isAccessCodeExpired,
  hashPassword,
  verifyPassword
};