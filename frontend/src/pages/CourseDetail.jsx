import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  BookOpen, 
  Users, 
  DollarSign,
  Calendar,
  Edit,
  GraduationCap
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/courses/${id}`)
      setCourse(response.data)
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="card">
          <div className="card-body">
            <div className="h-20 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Course not found</p>
        <Link to="/courses" className="btn btn-primary">
          Back to Courses
        </Link>
      </div>
    )
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-danger">Inactive</span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/courses" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            <p className="mt-2 text-gray-600">Course Details & Enrollments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Course Information</h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-6">
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-primary-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">{course.name}</h4>
                <div className="mt-2">
                  {getStatusBadge(course.isActive)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Price</p>
                    <p className="text-lg font-bold text-success-600">
                      ${parseFloat(course.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {course.duration && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-600">{course.duration}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Students Enrolled</p>
                    <p className="text-sm text-gray-600">
                      {course.enrollments?.length || 0} students
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {course.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                  <p className="text-sm text-gray-600">{course.description}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="btn btn-outline w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Student Enrollments</h3>
            </div>
            <div className="card-body">
              {course.enrollments?.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No students enrolled yet</p>
                  <button className="btn btn-primary">Enroll Students</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.enrollments?.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {enrollment.student.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {enrollment.student.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {enrollment.student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${
                            enrollment.status === 'ACTIVE' ? 'badge-success' :
                            enrollment.status === 'COMPLETED' ? 'badge-info' :
                            enrollment.status === 'CANCELLED' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {enrollment.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Batch</p>
                          <p className="font-medium">{enrollment.batch || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Start Date</p>
                          <p className="font-medium">
                            {new Date(enrollment.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Enrollment Date</p>
                          <p className="font-medium">
                            {new Date(enrollment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail


