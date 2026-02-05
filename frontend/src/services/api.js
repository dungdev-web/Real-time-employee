import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Owner API calls
export const ownerAPI = {
  // Create access code for phone login
  createAccessCode: async (phoneNumber) => {
    const response = await api.post('/api/owner/create-access-code', { phoneNumber });
    return response.data;
  },

  // Validate access code
  validateAccessCode: async (phoneNumber, accessCode) => {
    const response = await api.post('/api/owner/validate-access-code', {
      phoneNumber,
      accessCode
    });
    return response.data;
  },

  // Get all employees
  getAllEmployees: async () => {
    const response = await api.get('/api/owner/employees');
    return response.data;
  },

  // Get single employee
  getEmployee: async (employeeId) => {
    const response = await api.post('/api/owner/get-employee', { employeeId });
    return response.data;
  },

  // Create new employee
  createEmployee: async (employeeData) => {
    const response = await api.post('/api/owner/create-employee', employeeData);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeData) => {
    const response = await api.put('/api/owner/update-employee', employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (employeeId) => {
    const response = await api.post('/api/owner/delete-employee', { employeeId });
    return response.data;
  }
};

// Employee API calls
export const employeeAPI = {
  // Send login code to email
  loginEmail: async (email) => {
    const response = await api.post('/api/employee/login-email', { email });
    return response.data;
  },

  // Validate access code
  validateAccessCode: async (email, accessCode) => {
    const response = await api.post('/api/employee/validate-access-code', {
      email,
      accessCode
    });
    return response.data;
  },

  // Setup account
  setupAccount: async (token, employeeId, password) => {
    const response = await api.post('/api/employee/setup-account', {
      token,
      employeeId,
      password
    });
    return response.data;
  },

  // Get profile
  getProfile: async (employeeId) => {
    const response = await api.get(`/api/employee/profile/${employeeId}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/employee/update-profile', profileData);
    return response.data;
  },

  // Get tasks
  getTasks: async (employeeId) => {
    const response = await api.get(`/api/employee/tasks/${employeeId}`);
    return response.data;
  },

  // Complete task
  completeTask: async (employeeId, taskId) => {
    const response = await api.put(`/api/employee/task/${taskId}/complete`, {
      employeeId
    });
    return response.data;
  }
};

export default api;