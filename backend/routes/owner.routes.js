const express = require('express');
const router = express.Router();
const {
  createNewAccessCode,
  validateAccessCode,
  getEmployee,
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  updateEmployee
} = require('../controllers/ownerController');

// Authentication routes
router.post('/access-code', createNewAccessCode);
router.post('/access-code/verify', validateAccessCode);

// Employee management routes
// get empoyee by id
router.get('/employee/:employeeId', getEmployee);
// create employee
router.post('/employee', createEmployee);
// delete employee
router.delete('/employee/:employeeId', deleteEmployee);
// get all employees
router.get('/all-employees', getAllEmployees);
// update employee
router.put('/employee/:employeeId', updateEmployee);

module.exports = router;