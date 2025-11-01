import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Courses from './pages/Courses'
import Enrollments from './pages/Enrollments'
import Payments from './pages/Payments'
import StudentDetail from './pages/StudentDetail'
import CourseDetail from './pages/CourseDetail'
import EnrollmentDetail from './pages/EnrollmentDetail'
import { MonitoringProvider } from './components/MonitoringProvider'

function App() {
  return (
    <MonitoringProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="enrollments/:id" element={<EnrollmentDetail />} />
          <Route path="payments" element={<Payments />} />
        </Route>
      </Routes>
    </MonitoringProvider>
  )
}

export default App


