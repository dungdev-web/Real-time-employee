import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAPI, ownerAPI } from "../../services/api";
import "../../css/OwnerManageTask.scss";

function OwnerManageTask() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
    status: "pending",
  });

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "owner") {
      navigate("/owner/login");
      return;
    }
    loadTasksAndEmployees();
  }, [navigate]);

  const loadTasksAndEmployees = async () => {
    try {
      setLoading(true);

      // Load employees
      const empResponse = await ownerAPI.getAllEmployees();
      if (empResponse.success) {
        setEmployees(empResponse.employees || []);
        // console.log("dữ liệu:",empResponse.employees);
      }

      // Load tasks - you'll need to add this API endpoint
      const taskRes = await employeeAPI.getAlllTasks();
      if (taskRes.success) {
        setTasks(taskRes.tasks || []);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation
    if (!formData.title || !formData.assignedTo) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await employeeAPI.createTask(formData);

      // For now, add to local state
      const newTask = {
        taskId: `task_${Date.now()}`,
        ...formData,
        createdAt: Date.now(),
        createdBy: localStorage.getItem("ownerId"),
      };

      setTasks([newTask, ...tasks]);
      setMessage("Task created successfully!");
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
        status: "pending",
      });
      setShowAddForm(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      // await employeeAPI.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.taskId !== taskId));
      setMessage("Task deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete task");
    }
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      // await employeeAPI.updateTask(taskId, updatedData);
      setTasks(
        tasks.map((t) => (t.taskId === taskId ? { ...t, ...updatedData } : t)),
      );
      setMessage("Task updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update task");
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    if (filterEmployee !== "all") {
      filtered = filtered.filter(
        (task) => task.employeeName === filterEmployee,
      );
      console.log("dữ lieueeuue", filtered);
    }

    return filtered;
  };

  const getSortedTasks = (tasksToSort) => {
    const sorted = [...tasksToSort];

    switch (sortBy) {
      case "deadline":
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort((a, b) => {
          const aPriority = priorityOrder[a.priority] ?? 2;
          const bPriority = priorityOrder[b.priority] ?? 2;
          return aPriority - bPriority;
        });
      case "recent":
        return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      default:
        return sorted;
    }
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = getSortedTasks(filteredTasks);

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.employeeId === employeeId);
    return employee ? employee.name : "Unknown";
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
  const highPriorityTasks = tasks.filter(
    (t) => t.priority === "high" && t.status !== "completed",
  ).length;

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDateColor = (dateString) => {
    if (!dateString) return "neutral";
    const date = new Date(dateString);
    const today = new Date();

    if (date < today) {
      return "overdue";
    } else if (date.getTime() - today.getTime() < 86400000) {
      return "urgent";
    } else {
      return "normal";
    }
  };

  if (loading) {
    return (
      <div className="task-manage-loading">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-manage-container">
      {/* Background */}
      <div className="task-manage-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Header */}
      <header className="task-manage-header">
        <div className="header-content">
          <h1>Manage Tasks</h1>
          <p>Assign, track, and manage team tasks</p>
        </div>
        <button onClick={() => window.history.back()} className="back-button">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </header>

      {/* Notifications */}
      {error && (
        <div className="notification error-notification">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          {error}
          <button onClick={() => setError("")} className="close-notification">
            ✕
          </button>
        </div>
      )}

      {message && (
        <div className="notification success-notification">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M22 4L12 14.01L9 11.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {message}
          <button onClick={() => setMessage("")} className="close-notification">
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="task-manage-content">
        {/* Stats Cards */}
        {/* <div className="stats-grid">
          <div className="stat-card total-tasks">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{totalTasks}</h3>
              <p>Total Tasks</p>
            </div>
          </div>

          <div className="stat-card pending-tasks">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{pendingTasks}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card completed-tasks">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{completedTasks}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card high-priority-tasks">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26H22L17.45 12.42L19.54 18.58L12 14.42L4.46 18.58L6.55 12.42L2 8.26H8.91L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{highPriorityTasks}</h3>
              <p>High Priority</p>
            </div>
          </div>
        </div> */}

        {/* Add Task Section */}
        <div className="controls-section glass-card">
          <div className="controls-header">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="add-button"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {showAddForm ? "Cancel" : "Create Task"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddTask} className="add-task-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Assign To *</label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Task description"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 21V13H7V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 3V8H15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Create Task
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Employee</label>
              <select
                value={filterEmployee}
                onChange={(e) => {
                  (console.log(), setFilterEmployee(e.target.value));
                }}
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-section glass-card">
          <div className="section-header">
            <h2>
              Tasks
              <span className="task-count">({sortedTasks.length})</span>
            </h2>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="no-tasks">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 11L12 14L22 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3>No tasks found</h3>
              <p>Create a new task to get started</p>
            </div>
          ) : (
            <div className="task-list">
              {sortedTasks.map((task, index) => (
                <div
                  key={task.taskId}
                  className={`task-card ${task.status}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex">
                  <div className="task-header">
                    <h3 className="task-title">{task.title}</h3>
                    <span className={`status-badge ${task.status}`}>
                      {task.status === "completed" && "✓ Completed"}
                      {task.status === "in-progress" && "⚙ In Progress"}
                      {task.status === "pending" && "⏳ Pending"}
                    </span>
                  </div>
                  <div className="task-meta">
                    <span className="assigned-to">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {getEmployeeName(task.employeeId)}
                    </span>

                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority === "high" && "⚡ High"}
                      {task.priority === "medium" && "→ Medium"}
                      {task.priority === "low" && "↓ Low"}
                    </span>

                    {task.dueDate && (
                      <span
                        className={`date-badge ${getDateColor(task.dueDate)}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M16 2V6M8 2V6M3 10H21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}

                  <div className="task-actions">
                    {task.status !== "completed" && (
                      <button
                        onClick={() =>
                          handleUpdateTask(task.taskId, { status: "completed" })
                        }
                        className="complete-button"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Complete
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.taskId)}
                      className="delete-button"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6H5H21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerManageTask;
