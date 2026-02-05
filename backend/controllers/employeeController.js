const { getDatabase } = require('../config/firebase');
const emailService = require('../services/emailService');
const {
  generateAccessCode,
  isValidEmail,
  sanitizeInput,
  hashPassword,
  verifyPassword
} = require('../utils/helpers');

/**
 * POST /api/employee/login-email
 * Send access code to employee's email
 */
const loginEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    const db = getDatabase();
    const normalizedEmail = email.toLowerCase();

    // Find employee by email
    const employeesRef = db.ref('employees');
    const snapshot = await employeesRef.orderByChild('email').equalTo(normalizedEmail).once('value');
    const employees = snapshot.val();

    if (!employees) {
      return res.status(404).json({ 
        success: false, 
        error: 'No account found with this email' 
      });
    }

    const employeeId = Object.keys(employees)[0];
    const employee = employees[employeeId];

    // Check if account is set up
    if (!employee.accountSetup) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account not set up. Please check your email for the setup link.' 
      });
    }

    // Generate and save access code
    const accessCode = generateAccessCode();
    await db.ref(`employees/${employeeId}`).update({
      accessCode: accessCode,
      accessCodeCreatedAt: Date.now()
    });

    // Send access code via email
    try {
      await emailService.sendAccessCodeEmail(normalizedEmail, accessCode);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Continue anyway - code is saved in DB
    }

    res.json({ 
      success: true,
      accessCode: accessCode, // For testing purposes
      message: 'Access code sent to your email'
    });

  } catch (error) {
    console.error('Error in loginEmail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send login code' 
    });
  }
};

/**
 * POST /api/employee/validate-access-code
 * Validate employee's access code
 */
const validateAccessCode = async (req, res) => {
  try {
    const { accessCode, email } = req.body;

    if (!accessCode || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access code and email are required' 
      });
    }

    const db = getDatabase();
    const normalizedEmail = email.toLowerCase();

    // Find employee by email
    const employeesRef = db.ref('employees');
    const snapshot = await employeesRef.orderByChild('email').equalTo(normalizedEmail).once('value');
    const employees = snapshot.val();

    if (!employees) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    const employeeId = Object.keys(employees)[0];
    const employee = employees[employeeId];

    if (employee.accessCode !== accessCode) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid access code' 
      });
    }

    // Check if code is expired (10 minutes)
    const codeAge = Date.now() - (employee.accessCodeCreatedAt || 0);
    if (codeAge > 600000) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access code has expired' 
      });
    }

    // Clear the access code after successful validation
    await db.ref(`employees/${employeeId}`).update({
      accessCode: '',
      accessCodeCreatedAt: null,
      lastLogin: Date.now()
    });

    // Return employee data (without sensitive info)
    const { password, setupToken, ...safeEmployee } = employee;

    res.json({ 
      success: true,
      employeeId,
      employee: safeEmployee,
      message: 'Access code validated successfully'
    });

  } catch (error) {
    console.error('Error in validateAccessCode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate access code' 
    });
  }
};

/**
 * POST /api/employee/setup-account
 * Set up employee account with password
 */
const setupAccount = async (req, res) => {
  try {
    const { token, employeeId, password } = req.body;

    if (!token || !employeeId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token, employee ID, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    const db = getDatabase();
    const employeeRef = db.ref(`employees/${employeeId}`);
    const snapshot = await employeeRef.once('value');
    const employee = snapshot.val();

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    if (employee.accountSetup) {
      return res.status(400).json({ 
        success: false, 
        error: 'Account already set up. Please use login.' 
      });
    }

    if (employee.setupToken !== token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid setup token' 
      });
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - (employee.setupTokenCreatedAt || 0);
    if (tokenAge > 86400000) {
      return res.status(401).json({ 
        success: false, 
        error: 'Setup link has expired. Please contact your manager.' 
      });
    }

    // Hash password and update account
    const hashedPassword = hashPassword(password);
    await employeeRef.update({
      password: hashedPassword,
      accountSetup: true,
      setupToken: '',
      setupTokenCreatedAt: null,
      accountSetupAt: Date.now()
    });

    res.json({ 
      success: true,
      message: 'Account set up successfully. You can now log in.'
    });

  } catch (error) {
    console.error('Error in setupAccount:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to set up account' 
    });
  }
};

/**
 * GET /api/employee/profile/:employeeId
 * Get employee profile
 */
const getProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }

    const db = getDatabase();
    const employeeRef = db.ref(`employees/${employeeId}`);
    const snapshot = await employeeRef.once('value');
    const employee = snapshot.val();

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Remove sensitive data
    const { password, accessCode, setupToken, ...safeEmployee } = employee;

    res.json({ 
      success: true,
      employee: safeEmployee
    });

  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve profile' 
    });
  }
};

/**
 * PUT /api/employee/update-profile
 * Update employee profile
 */
const updateProfile = async (req, res) => {
  try {
    const { employeeId, name, phone } = req.body;

    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }

    const db = getDatabase();
    const employeeRef = db.ref(`employees/${employeeId}`);
    
    // Check if employee exists
    const snapshot = await employeeRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: Date.now()
    };

    if (name) updateData.name = sanitizeInput(name);
    if (phone) updateData.phone = sanitizeInput(phone);

    await employeeRef.update(updateData);

    res.json({ 
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile' 
    });
  }
};

/**
 * GET /api/employee/tasks/:employeeId
 * Get employee's tasks
 */
const getTasks = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }

    const db = getDatabase();
    const tasksRef = db.ref(`employees/${employeeId}/tasks`);
    const snapshot = await tasksRef.once('value');
    const tasks = snapshot.val();

    res.json({ 
      success: true,
      tasks: tasks ? Object.values(tasks) : []
    });

  } catch (error) {
    console.error('Error in getTasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve tasks' 
    });
  }
};

/**
 * PUT /api/employee/task/:taskId/complete
 * Mark task as complete
 */
const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { employeeId } = req.body;

    if (!taskId || !employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task ID and Employee ID are required' 
      });
    }

    const db = getDatabase();
    const taskRef = db.ref(`employees/${employeeId}/tasks/${taskId}`);
    
    // Check if task exists
    const snapshot = await taskRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    // Update task status
    await taskRef.update({
      status: 'completed',
      completedAt: Date.now()
    });

    res.json({ 
      success: true,
      message: 'Task marked as complete'
    });

  } catch (error) {
    console.error('Error in completeTask:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete task' 
    });
  }
};

module.exports = {
  loginEmail,
  validateAccessCode,
  setupAccount,
  getProfile,
  updateProfile,
  getTasks,
  completeTask
};