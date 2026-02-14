const { getDatabase } = require("../config/firebase");
const smsService = require("../services/smsService");
const emailService = require("../services/emailService");
const {
  generateAccessCode,
  generateEmployeeId,
  generateSetupToken,
  formatPhoneNumber,
  isValidEmail,
  isValidPhoneNumber,
  sanitizeInput,
  createConversationId,
  generateMessageId
} = require("../utils/helpers");

/**
 * POST /api/owner/create-access-code
 * Generate and send access code to owner's phone
 */
const Owner = process.env.OwnerId;
const createNewAccessCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if(phoneNumber != Owner){
      return res.status(500).json({
        success:false,
        error:"Owner has been create"
      })
    }
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    // Validate and format phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const accessCode = generateAccessCode();
    const db = getDatabase();

    // Save access code to database
    const ownerRef = db.ref(`owners/${formattedPhone}`);
    await ownerRef.update({
      phoneNumber: formattedPhone,
      accessCode: accessCode,
      accessCodeCreatedAt: Date.now(),
      lastLogin: Date.now(),
    });
    smsSent = true;

    // Send SMS with access code
    try {
      await smsService.sendAccessCode(formattedPhone, accessCode);
    } catch (smsError) {
      smsSent = false;

      console.error("SMS sending failed:", smsError.message);
      // Continue anyway - code is saved in DB
    }

    res.json({
      success: true,
      accessCode, // chỉ trả khi dev
      smsSent,
      message: smsSent
        ? "Access code sent to your phone"
        : "Access code generated but SMS failed",
    });
  } catch (error) {
    console.error("Error in createNewAccessCode:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate access code",
    });
  }
};

/**
 * POST /api/owner/validate-access-code
 * Validate owner's access code
 */
const validateAccessCode = async (req, res) => {
  try {
    const { accessCode, phoneNumber } = req.body;

    if (!accessCode || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Access code and phone number are required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const db = getDatabase();
    const ownerRef = db.ref(`owners/${formattedPhone}`);
    const snapshot = await ownerRef.once("value");
    const owner = snapshot.val();

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: "Owner not found",
      });
    }

    if (owner.accessCode !== accessCode) {
      return res.status(401).json({
        success: false,
        error: "Invalid access code",
      });
    }

    // Check if code is expired (10 minutes)
    const codeAge = Date.now() - (owner.accessCodeCreatedAt || 0);
    if (codeAge > 600000) {
      return res.status(401).json({
        success: false,
        error: "Access code has expired",
      });
    }

    // Clear the access code after successful validation
    await ownerRef.update({
      accessCode: "",
      accessCodeCreatedAt: null,
      lastValidatedLogin: Date.now(),
    });

    res.json({
      success: true,
      ownerId: formattedPhone,
      message: "Access code validated successfully",
    });
  } catch (error) {
    console.error("Error in validateAccessCode:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate access code",
    });
  }
};

/**
 * POST /api/owner/get-employee
 * Get employee details by ID
 */
const getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required",
      });
    }

    const db = getDatabase();
    const employeeRef = db.ref(`employees/${employeeId}`);
    const snapshot = await employeeRef.once("value");
    const employee = snapshot.val();

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    // Remove sensitive data before sending
    const { password, accessCode, ...safeEmployee } = employee;

    res.json({
      success: true,
      employee: safeEmployee,
    });
  } catch (error) {
    console.error("Error in getEmployee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve employee",
    });
  }
};

/**
 * POST /api/owner/create-employee
 * Create a new employee and send setup email
 */
const createEmployee = async (req, res) => {
  try {
    const { name, email, department, phone, role, ownerId } = req.body;

    // Validation
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and department are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: "Owner ID is required",
      });
    }

    const db = getDatabase();
    const existingEmployee = await db
      .ref("employees")
      .orderByChild("email")
      .equalTo(email.toLowerCase())
      .once("value");

    if (existingEmployee.exists()) {
      return res.status(400).json({
        success: false,
        error: "Email đã được sử dụng",
      });
    }
    const employeeId = generateEmployeeId();
    const setupToken = generateSetupToken();

    // Create employee record
    const employeeData = {
      employeeId,
      name: sanitizeInput(name),
      email: email.toLowerCase(),
      department: sanitizeInput(department),
      phone: phone ? formatPhoneNumber(phone) : "",
      role: role ? sanitizeInput(role) : "Employee",
      ownerId: String(ownerId).startsWith("+")
        ? String(ownerId)
        : `+${ownerId}`, // ✅ ADD THIS!
      setupToken,
      setupTokenCreatedAt: Date.now(),
      accountSetup: false,
      createdAt: Date.now(),
      accessCode: "",
      tasks: {},
    };

    await db.ref(`employees/${employeeId}`).set(employeeData);
    const conversationId = createConversationId(ownerId, employeeId);

    const messageId = generateMessageId();
    const welcomeMessage = {
      messageId,
      senderId: ownerId,
      senderType: "owner",
      receiverId: ownerId,
      message: `Hi!`,
      timestamp: Date.now(),
      read: false,
    };
    await db.ref(`messages/${conversationId}/${messageId}`).set(welcomeMessage);

    // Generate setup link
    const setupLink = `${process.env.FRONTEND_URL}/employee/setup?token=${setupToken}&id=${employeeId}`;

    // Send welcome email with setup link
    try {
      await emailService.sendEmployeeWelcomeEmail(email, name, setupLink);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // Continue anyway - employee is created
    }

    res.json({
      success: true,
      employeeId,
      ownerId: employeeData.ownerId,
      conversationId,
      message: "Employee created successfully. Setup email sent.",
      // setupLink,
    });
  } catch (error) {
    console.error("Error in createEmployee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create employee",
    });
  }
};

/**
 * POST /api/owner/delete-employee
 * Delete an employee from the system
 */
const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required",
      });
    }

    const db = getDatabase();
    const employeeRef = db.ref(`employees/${employeeId}`);

    // Check if employee exists
    const snapshot = await employeeRef.once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    // Delete employee
    await employeeRef.remove();

    // Optional: Clean up messages related to this employee
    // This is a simple implementation - in production you might want to archive instead
    const messagesRef = db.ref("messages");
    const messagesSnapshot = await messagesRef.once("value");
    const messages = messagesSnapshot.val();

    if (messages) {
      const deletePromises = [];
      Object.keys(messages).forEach((conversationId) => {
        if (conversationId.includes(employeeId)) {
          deletePromises.push(db.ref(`messages/${conversationId}`).remove());
        }
      });
      await Promise.all(deletePromises);
    }

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete employee",
    });
  }
};

/**
 * GET /api/owner/employees
 * Get all employees
 */
const getAllEmployees = async (req, res) => {
  try {
    const db = getDatabase();
    const employeesRef = db.ref("employees");
    const snapshot = await employeesRef.once("value");
    const employees = snapshot.val();

    if (!employees) {
      return res.json({
        success: true,
        employees: [],
      });
    }

    // Remove sensitive data and convert to array
    const employeeList = Object.values(employees).map((emp) => {
      const { password, accessCode, setupToken, ...safeEmployee } = emp;
      return safeEmployee;
    });

    res.json({
      success: true,
      employees: employeeList,
    });
  } catch (error) {
    console.error("Error in getAllEmployees:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve employees",
    });
  }
};

/**
 * PUT /api/owner/update-employee
 * Update employee details
 */
const updateEmployee = async (req, res) => {
  try {
    const { name, email, department, phone, role } = req.body;
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required",
      });
    }

    const db = getDatabase();
    const employeeRef = db.ref(`employees/${employeeId}`);

    // Check if employee exists
    const snapshot = await employeeRef.once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: Date.now(),
    };

    if (name) updateData.name = sanitizeInput(name);
    if (email && isValidEmail(email)) updateData.email = email.toLowerCase();
    if (department) updateData.department = sanitizeInput(department);
    if (phone) updateData.phone = formatPhoneNumber(phone);
    if (role) updateData.role = sanitizeInput(role);

    await employeeRef.update(updateData);

    res.json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("Error in updateEmployee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update employee",
    });
  }
};

module.exports = {
  createNewAccessCode,
  validateAccessCode,
  getEmployee,
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  updateEmployee,
};
