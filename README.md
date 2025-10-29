# VA CRM - Education Business Management System

A lightweight, full-stack MVP CRM system designed specifically for education businesses. Built with modern web technologies and a mobile-responsive design.

## 🚀 Features

### Core Functionality
- **Student Management**: Complete CRUD operations for student profiles
- **Course Management**: Manage courses with pricing and enrollment tracking
- **Enrollment Tracking**: Record and monitor student enrollments
- **Payment Tracking**: Track payments and outstanding amounts
- **Dashboard**: Comprehensive overview with analytics and charts
- **Bulk Import**: Import students from CSV files (Google Sheets export)

### Technical Features
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Updates**: Live data updates and notifications
- **Search & Filtering**: Advanced search and filtering capabilities
- **Pagination**: Efficient data handling for large datasets
- **Form Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **PostgreSQL** database with **Prisma ORM**
- **JWT** authentication (ready for future implementation)
- **Multer** for file uploads
- **Express Validator** for input validation

### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **TailwindCSS** for responsive styling
- **React Router** for navigation
- **React Hook Form** for form management
- **Axios** for API communication
- **Lucide React** for icons

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** database server
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd va-crm
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install:all
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE va_crm_db;
CREATE USER va_crm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE va_crm_db TO va_crm_user;
```

#### Configure Environment Variables
```bash
# Copy the environment template
cp backend/env.example backend/.env

# Edit the .env file with your database credentials
DATABASE_URL="postgresql://va_crm_user:your_password@localhost:5432/va_crm_db"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 4. Database Migration
```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view/edit data
npm run db:studio
```

### 5. Start the Application

#### Development Mode (Both Frontend & Backend)
```bash
# From the root directory
npm run dev
```

#### Individual Services
```bash
# Backend only (Port 5000)
npm run dev:backend

# Frontend only (Port 3000)
npm run dev:frontend
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Prisma Studio**: http://localhost:5555 (when running)

## 📁 Project Structure

```
va-crm/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── lib/            # Database and utilities
│   │   └── index.js        # Main server file
│   ├── prisma/             # Database schema and migrations
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # TailwindCSS configuration
├── package.json            # Root package.json with scripts
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/va_crm_db"

# Server
PORT=5000
NODE_ENV=development

# JWT (for future authentication)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Database Schema

The system includes the following main entities:

- **Students**: Basic information, contact details
- **Courses**: Course details, pricing, availability
- **Enrollments**: Student-course relationships, status tracking
- **Payments**: Payment records, methods, amounts

## 📱 Mobile Responsiveness

The application is built with a mobile-first approach using TailwindCSS:

- **Responsive Grid**: Adapts to different screen sizes
- **Mobile Navigation**: Collapsible sidebar for mobile devices
- **Touch-Friendly**: Optimized for touch interactions
- **Flexible Tables**: Horizontal scrolling on small screens

## 🚀 Deployment

### Local Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Render/Vercel Deployment

#### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Configure environment variables

#### Backend (Render)
1. Create a new Web Service
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Configure environment variables
6. Add PostgreSQL database service

## 🔒 Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Configuration**: Restricted cross-origin requests
- **Helmet.js**: Security headers and middleware
- **File Upload Limits**: Restricted file types and sizes

## 📊 API Endpoints

### Students
- `GET /api/students` - List students with filters
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk-import` - Bulk import from CSV

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `GET /api/enrollments` - List enrollments
- `POST /api/enrollments` - Create enrollment
- `PUT /api/enrollments/:id` - Update enrollment
- `PATCH /api/enrollments/:id/status` - Update status

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `GET /api/payments/student/:id/summary` - Payment summary

### Dashboard
- `GET /api/dashboard/overview` - Dashboard statistics
- `GET /api/dashboard/enrollments` - Enrollment analytics
- `GET /api/dashboard/payments` - Payment analytics

## 🧪 Testing

### Manual Testing
1. **Student Management**: Add, edit, delete students
2. **Course Management**: Create and manage courses
3. **Enrollments**: Enroll students in courses
4. **Payments**: Record and track payments
5. **CSV Import**: Test bulk student import
6. **Mobile Responsiveness**: Test on different screen sizes

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Health check
curl http://localhost:5000/health

# Get students
curl http://localhost:5000/api/students

# Create student
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"1234567890"}'
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and user has permissions

#### Port Conflicts
- Backend default: 5000
- Frontend default: 3000
- Change ports in configuration files if needed

#### CORS Issues
- Verify `CORS_ORIGIN` in backend `.env`
- Check frontend is running on correct port

#### Build Errors
- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

### Logs
- Backend logs appear in terminal
- Frontend errors in browser console
- Database queries logged in development mode

## 🔮 Future Enhancements

### Phase 2 Features
- **User Authentication**: Login/logout system
- **Role-based Access**: Admin, teacher, student roles
- **Email Notifications**: Automated reminders
- **Advanced Reporting**: Custom reports and exports
- **Calendar Integration**: Schedule management

### Phase 3 Features
- **Mobile App**: React Native application
- **Real-time Chat**: Student-teacher communication
- **Video Integration**: Course content delivery
- **Payment Gateway**: Online payment processing
- **Analytics Dashboard**: Advanced business insights

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review API documentation
3. Check existing issues
4. Create a new issue with detailed information

## 🙏 Acknowledgments

- **Prisma** for excellent ORM
- **TailwindCSS** for utility-first CSS
- **React** team for the amazing framework
- **Express.js** for the robust backend framework

---

**Built with ❤️ for education businesses**


