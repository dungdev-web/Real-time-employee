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
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it doesn't start with country code, assume US (+1)
  if (!cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  
  // Add + prefix
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
 * Create a conversation ID between owner and employee
 */
const createConversationId = (ownerId, employeeId) => {
  // Sort to ensure consistent ID regardless of order
  const ids = [ownerId, employeeId].sort();
  return `${ids[0]}_${ids[1]}`;
};

/**
 * Sanitize user input to prevent injection
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 500); // Limit length
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
  return new Date(timestamp).toLocaleString();
};

/**
 * Check if access code has expired
 */
const isAccessCodeExpired = (createdAt, expiryMs = 600000) => {
  // Default expiry: 10 minutes (600000 ms)
  return Date.now() - createdAt > expiryMs;
};

/**
 * Hash password using simple algorithm (in production, use bcrypt)
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Verify password
 */
const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
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