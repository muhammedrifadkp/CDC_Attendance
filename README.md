# 🎓 CDC Attendance Management System

<div align="center">

![CDC Attendance](https://img.shields.io/badge/CDC-Attendance%20System-blue?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-red?style=for-the-badge)

**A comprehensive, enterprise-grade attendance management system built with the MERN stack**

[🚀 Live Demo](#) • [📖 Documentation](#) • [🐛 Report Bug](#) • [✨ Request Feature](#)

</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🚀 Tech Stack](#-tech-stack)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🔧 Usage](#-usage)
- [📊 API Documentation](#-api-documentation)
- [🛡️ Security](#️-security)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## 🌟 Features

### 👨‍💼 **Admin Dashboard**
- 🏢 **Institution Management**: Complete control over departments, courses, and batches
- 👥 **User Management**: Create and manage teachers, lab teachers, and administrators
- 📊 **Analytics & Reports**: Real-time attendance insights and comprehensive reporting
- 🔔 **Notification System**: Broadcast announcements and important updates
- 🖥️ **Lab Management**: PC allocation, maintenance tracking, and resource management

### 👨‍🏫 **Teacher Portal**
- ✅ **Quick Attendance**: Streamlined attendance marking with batch selection
- 📈 **Performance Tracking**: Monitor student attendance patterns and trends
- 👨‍🎓 **Student Management**: View and manage assigned students and batches
- 📄 **Report Generation**: Export attendance data in multiple formats
- 🔧 **Profile Management**: Update personal information and preferences

### 🔬 **Lab Teacher Features**
- 💻 **PC Management**: Real-time computer status tracking and assignments
- 📅 **Lab Scheduling**: Manage lab sessions and equipment bookings
- 🔧 **Maintenance Logs**: Track equipment issues and maintenance schedules
- 🚪 **Access Control**: Monitor and control student lab access

### 🛡️ **Security & Performance**
- 🔐 **JWT Authentication**: Secure token-based authentication with fingerprinting
- 🛡️ **Role-Based Access**: Granular permissions for different user types
- 🚫 **Input Validation**: Comprehensive XSS and injection protection
- ⚡ **Performance Monitoring**: Real-time API and database performance tracking
- 📝 **Error Logging**: Comprehensive error tracking and reporting

---

## 🚀 Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![React Router](https://img.shields.io/badge/React-Router-CA4245?style=flat-square&logo=react-router)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=json-web-tokens)

### Security & Tools
![Helmet.js](https://img.shields.io/badge/Helmet.js-Security-FF6B6B?style=flat-square)
![Bcrypt](https://img.shields.io/badge/Bcrypt-Hashing-4ECDC4?style=flat-square)
![Nodemailer](https://img.shields.io/badge/Nodemailer-Email-45B7D1?style=flat-square)

</div>

---

## 📦 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (Atlas account or local installation)
- **Git**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/muhammedrifadkp/CDC_Attendance.git
cd CDC_Attendance

# Install dependencies for both frontend and backend
npm install

# Start the development servers
npm run dev
```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start backend server
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env
# Configure API endpoints

# Start frontend server
npm run dev
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cdc_attendance

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here
JWT_EXPIRE=30d

# Email Configuration (Gmail)
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CDC Attendance System
VITE_APP_VERSION=1.0.0
```

---

## 🔧 Usage

### Available Scripts

#### Root Level Commands
```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build for production
npm run test         # Run all tests
```

#### Backend Commands
```bash
npm run dev          # Development with nodemon
npm start            # Production start
npm run test         # Run backend tests
```

#### Frontend Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run frontend tests
```

### Default Login Credentials

**Admin Account:**
- Email: `admin@cdc.com`
- Password: `Admin@123`

**Teacher Account:**
- Email: `teacher@cdc.com`
- Password: `Teacher@123`

---

## 📊 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/login` | User authentication |
| POST | `/api/users/logout` | User logout |
| POST | `/api/users/refresh-token` | Refresh JWT token |
| GET | `/api/users/profile` | Get user profile |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/admins` | Create admin |
| GET | `/api/users/admins` | Get all admins |
| PUT | `/api/users/admins/:id` | Update admin |
| DELETE | `/api/users/admins/:id` | Delete admin |
| POST | `/api/users/teachers` | Create teacher |
| GET | `/api/users/teachers` | Get all teachers |

### Student Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students` | Create student |
| GET | `/api/students` | Get all students |
| GET | `/api/students/:id` | Get student by ID |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Attendance Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance` | Mark attendance |
| GET | `/api/attendance/batch/:batchId` | Get batch attendance |
| GET | `/api/attendance/student/:studentId` | Get student attendance |
| GET | `/api/attendance/analytics` | Get attendance analytics |

---

## 🛡️ Security

### Authentication & Authorization
- **JWT Tokens** with fingerprinting for enhanced security
- **Role-based access control** (Admin, Teacher, Lab Teacher)
- **Secure password hashing** using bcrypt
- **Token refresh mechanism** for seamless user experience

### Data Protection
- **Input validation** and sanitization on all endpoints
- **XSS protection** using specialized middleware
- **MongoDB injection prevention** with query sanitization
- **Rate limiting** to prevent API abuse
- **CORS configuration** for secure cross-origin requests

### Security Headers
- **Helmet.js** for comprehensive security headers
- **Content Security Policy** implementation
- **HTTPS enforcement** in production
- **Secure cookie configuration**

---

## 🚀 Deployment

### Production Checklist

- [ ] **Environment Variables**: Update all production configurations
- [ ] **Database**: Configure MongoDB Atlas for production
- [ ] **Email Service**: Set up production email service
- [ ] **Domain & SSL**: Configure custom domain with SSL certificate
- [ ] **Monitoring**: Set up error tracking and performance monitoring
- [ ] **Backup Strategy**: Implement database backup procedures

### Recommended Platforms

#### Frontend Deployment
- **Vercel** (Recommended) - Automatic deployments from Git
- **Netlify** - Easy static site hosting
- **AWS S3 + CloudFront** - Scalable cloud hosting

#### Backend Deployment
- **Railway** (Recommended) - Simple Node.js hosting
- **Heroku** - Popular platform-as-a-service
- **AWS EC2** - Full control cloud hosting
- **DigitalOcean** - Developer-friendly cloud platform

#### Database
- **MongoDB Atlas** (Recommended) - Managed MongoDB service
- **AWS DocumentDB** - Amazon's MongoDB-compatible service

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Make** your changes
5. **Test** your changes thoroughly
6. **Commit** your changes (`git commit -m 'Add amazing feature'`)
7. **Push** to your branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Commercial use** allowed
- ✅ **Modification** allowed
- ✅ **Distribution** allowed
- ✅ **Private use** allowed
- ❌ **Liability** not provided
- ❌ **Warranty** not provided

---

## 👨‍💻 Author & Support

<div align="center">

**Muhammed Rifad KP**

[![GitHub](https://img.shields.io/badge/GitHub-muhammedrifadkp-181717?style=flat-square&logo=github)](https://github.com/muhammedrifadkp)
[![Email](https://img.shields.io/badge/Email-muhammedrifadkp3@gmail.com-D14836?style=flat-square&logo=gmail)](mailto:muhammedrifadkp3@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/muhammedrifadkp)

</div>

### 🆘 Support

If you encounter any issues or have questions:

1. **Check** the [Issues](https://github.com/muhammedrifadkp/CDC_Attendance/issues) page
2. **Search** for existing solutions
3. **Create** a new issue if needed
4. **Provide** detailed information about the problem

### 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **MongoDB Team** - For the excellent database solution
- **Express.js Community** - For the robust web framework
- **Open Source Contributors** - For making this project possible

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

![Stars](https://img.shields.io/github/stars/muhammedrifadkp/CDC_Attendance?style=social)
![Forks](https://img.shields.io/github/forks/muhammedrifadkp/CDC_Attendance?style=social)
![Issues](https://img.shields.io/github/issues/muhammedrifadkp/CDC_Attendance?style=social)

**Made with ❤️ for the education community**

</div>
