# Employee Task Management System - Technical Documentation

## Project Overview

A full-stack real-time employee task management application built with React, Express, Firebase, and Socket.io. The system enables managers (owners) to manage employees, assign tasks, and communicate in real-time via chat.

## Technology Stack

### Frontend
- **React 18.2.0** - UI library
- **React Router 6.11.0** - Client-side routing
- **Axios 1.4.0** - HTTP client
- **Socket.io Client 4.6.1** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **Socket.io 4.6.1** - Real-time bidirectional communication
- **Firebase Admin 12.0.0** - Database SDK
- **Nodemailer 6.9.1** - Email service
- **Twilio 4.10.0** - SMS service
- **Bcrypt 5.1.1** - Password hashing
- **Helmet 7.0.0** - Security middleware
- **Express Rate Limit 6.7.0** - Rate limiting

### Database
- **Firebase Realtime Database** - NoSQL cloud database

### Additional Services
- **Twilio / SMS.to** - SMS delivery
- **SMTP (Gmail/SendGrid/etc.)** - Email delivery

## System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Express   │◄───────►│  Firebase   │
│   (React)   │         │   Server    │         │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │
      │                       │
      │                 ┌─────┴─────┐
      │                 │           │
      │              ┌──▼──┐    ┌──▼───┐
      │              │Twilio│    │Email │
      │              │ SMS  │    │SMTP  │
      │              └──────┘    └──────┘
      │
      ├── Socket.io (Real-time Chat)
      └─────────────────────────────────►
```

## Database Schema

```
firebase/
├── owners/
│   └── {phoneNumber}/
│       ├── phoneNumber: string
│       ├── accessCode: string
│       ├── accessCodeCreatedAt: number
│       └── lastLogin: number
│
├── employees/
│   └── {employeeId}/
│       ├── employeeId: string
│       ├── name: string
│       ├── email: string
│       ├── department: string
│       ├── phone: string
│       ├── role: string
│       ├── setupToken: string
│       ├── setupTokenCreatedAt: number
│       ├── accountSetup: boolean
│       ├── password: string (hashed)
│       ├── accessCode: string
│       ├── accessCodeCreatedAt: number
│       ├── createdAt: number
│       └── tasks/
│           └── {taskId}/
│               ├── taskId: string
│               ├── title: string
│               ├── description: string
│               ├── status: string
│               ├── assignedBy: string
│               ├── createdAt: number
│               └── completedAt: number
│
└── messages/
    └── {conversationId}/
        └── {messageId}/
            ├── messageId: string
            ├── senderId: string
            ├── senderType: string
            ├── receiverId: string
            ├── message: string
            ├── timestamp: number
            └── read: boolean
```

## User Flows

### Owner Flow

1. **Login**
   - Enter phone number
   - Receive SMS with 6-digit code
   - Enter code to authenticate
   - Redirect to dashboard

2. **Employee Management**
   - View all employees
   - Add new employee (triggers email)
   - Edit employee details
   - Delete employee

3. **Real-time Communication**
   - Select employee to chat with
   - Send/receive messages in real-time
   - See typing indicators
   - View message history

### Employee Flow

1. **Account Setup** (First time)
   - Receive email with setup link
   - Click link (with token)
   - Create password
   - Account activated

2. **Login**
   - Enter email address
   - Receive access code via email
   - Enter code to authenticate
   - Redirect to dashboard

3. **Dashboard Actions**
   - View/edit profile
   - View assigned tasks
   - Mark tasks as complete
   - Chat with manager

## API Endpoints

### Owner Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/owner/create-access-code` | Generate SMS code |
| POST | `/api/owner/validate-access-code` | Verify SMS code |
| GET | `/api/owner/employees` | Get all employees |
| POST | `/api/owner/get-employee` | Get single employee |
| POST | `/api/owner/create-employee` | Create new employee |
| PUT | `/api/owner/update-employee` | Update employee |
| POST | `/api/owner/delete-employee` | Delete employee |

### Employee Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/employee/login-email` | Send email code |
| POST | `/api/employee/validate-access-code` | Verify email code |
| POST | `/api/employee/setup-account` | Setup new account |
| GET | `/api/employee/profile/:id` | Get profile |
| PUT | `/api/employee/update-profile` | Update profile |
| GET | `/api/employee/tasks/:id` | Get tasks |
| PUT | `/api/employee/task/:id/complete` | Complete task |

## Socket.io Events

### Client → Server

- `join-conversation` - Join a chat room
- `send-message` - Send a message
- `typing` - Send typing indicator
- `mark-as-read` - Mark messages as read
- `leave-conversation` - Leave chat room

### Server → Client

- `load-messages` - Initial message history
- `new-message` - New message received
- `user-typing` - Other user typing
- `messages-read` - Messages marked as read
- `error` - Error notification

## Security Features

### Authentication
- Two-factor authentication (phone/email + code)
- Access codes expire after 10 minutes
- Setup tokens expire after 24 hours
- Password hashing using SHA-256

### Rate Limiting
- 10 requests per 15 minutes on auth endpoints
- Prevents brute force attacks

### Data Protection
- Input sanitization on all user inputs
- Helmet.js for security headers
- CORS configuration
- Environment variable protection

### Firebase Security
- Service account authentication
- Database rules (set to appropriate level)

## File Structure

```
employee-task-management/
├── backend/
│   ├── config/
│   │   └── firebase.js
│   ├── controllers/
│   │   ├── ownerController.js
│   │   └── employeeController.js
│   ├── routes/
│   │   ├── ownerRoutes.js
│   │   └── employeeRoutes.js
│   ├── services/
│   │   ├── smsService.js
│   │   └── emailService.js
│   ├── utils/
│   │   └── helpers.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.js
│   │   │   └── Chat.css
│   │   ├── pages/
│   │   │   ├── OwnerLogin.js
│   │   │   ├── OwnerDashboard.js
│   │   │   ├── EmployeeLogin.js
│   │   │   ├── EmployeeSetup.js
│   │   │   ├── EmployeeDashboard.js
│   │   │   └── [CSS files]
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── README.md
├── SETUP_GUIDE.md
├── API_TESTING.md
└── .gitignore
```

## Key Implementation Details

### Access Code Generation
```javascript
// 6-digit random code
const code = Math.floor(100000 + Math.random() * 900000).toString();
```

### Phone Number Formatting
```javascript
// Convert to E.164 format
const formatted = '+' + phoneNumber.replace(/\D/g, '');
```

### Real-time Message Flow
1. User types message and clicks send
2. Frontend emits `send-message` via Socket.io
3. Backend saves to Firebase
4. Backend emits `new-message` to conversation room
5. All clients in room receive message instantly

### Conversation ID Creation
```javascript
// Consistent ID regardless of who initiates
const conversationId = [userId1, userId2].sort().join('_');
```

## Error Handling

### Frontend
- Try-catch blocks on all API calls
- User-friendly error messages
- Loading states during async operations
- Form validation

### Backend
- Express error handling middleware
- Consistent error response format
- Detailed console logging
- Graceful degradation (simulated SMS/email when services unavailable)

## Performance Optimizations

1. **Database Queries**
   - Limited message history (last 50 messages)
   - Indexed queries where applicable

2. **Real-time Updates**
   - Socket.io rooms for isolated conversations
   - Event-driven architecture reduces polling

3. **Frontend**
   - React state management
   - Conditional rendering
   - Auto-scroll optimization

## Testing Strategy

### Manual Testing
1. Test all user flows
2. Test error scenarios
3. Test edge cases (expired codes, invalid inputs)
4. Test real-time features with multiple users

### API Testing
- Use curl or Postman
- Test all endpoints
- Verify response formats
- Check error handling

### Security Testing
- Test rate limiting
- Test access code expiration
- Test unauthorized access attempts

## Deployment Considerations

### Environment Variables
- Never commit `.env` files
- Use environment-specific configurations
- Secure credential storage in production

### Database
- Update Firebase security rules for production
- Set up database backups
- Monitor usage and costs

### Scaling
- Consider load balancers for high traffic
- Use Redis for Socket.io scaling (multiple servers)
- Implement caching where appropriate

### Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API performance
- Track user analytics

## Future Enhancements

1. **Features**
   - Task assignment by managers
   - File attachments in chat
   - Push notifications
   - Employee schedules
   - Performance reviews
   - Team management

2. **Technical**
   - Unit tests
   - Integration tests
   - CI/CD pipeline
   - Docker containerization
   - Database migrations
   - API versioning

3. **Security**
   - OAuth integration
   - Two-factor authentication app support
   - Session management
   - Audit logs

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Verify `serviceAccountKey.json` exists
   - Check database URL in `.env`
   - Ensure Firebase project is active

2. **Socket.io Not Connecting**
   - Check CORS settings
   - Verify Socket URL in frontend
   - Check firewall settings

3. **SMS/Email Not Sending**
   - Verify credentials in `.env`
   - Check service provider status
   - Review console logs for simulated messages

4. **Access Code Expired**
   - Codes expire after 10 minutes
   - Request a new code
   - Check system time synchronization

## Code Quality Standards

- **Consistent naming** - camelCase for variables, PascalCase for components
- **Comments** - Explain complex logic
- **Error messages** - Clear and actionable
- **Validation** - Input validation on frontend and backend
- **Separation of concerns** - Controllers, services, and routes separated

## License

MIT License - Free to use for educational and commercial purposes

## Credits

Built as a coding challenge demonstrating full-stack development skills with:
- Modern JavaScript (ES6+)
- RESTful API design
- Real-time communication
- Database design
- Authentication flows
- Third-party API integration
- Security best practices

---

**Note:** All code in this project is original and built from scratch according to the challenge requirements. No code was copied or plagiarized from external sources.
