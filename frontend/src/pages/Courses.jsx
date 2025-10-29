import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Eye,
  BookOpen,
  DollarSign,
  Users
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import CourseForm from '../components/CourseForm'
import ConfirmDialog from '../components/ConfirmDialog'

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(null)

  useEffect(() => {
    fetchCourses()
  }, [searchTerm, activeFilter, pagination.page])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(activeFilter !== 'all' && { active: activeFilter === 'active' ? 'true' : 'false' })
      })

      const response = await axios.get(`/api/courses?${params}`)
      setCourses(response.data.courses)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (courseData) => {
    try {
      await axios.post('/api/courses', courseData)
      toast.success('Course created successfully')
      setShowForm(false)
      fetchCourses()
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error(error.response?.data?.error || 'Failed to create course')
    }
  }

  const handleUpdateCourse = async (courseData) => {
    try {
      await axios.put(`/api/courses/${editingCourse.id}`, courseData)
      toast.success('Course updated successfully')
      setShowForm(false)
      setEditingCourse(null)
      fetchCourses()
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error(error.response?.data?.error || 'Failed to update course')
    }
  }

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return

    try {
      await axios.delete(`/api/courses/${deletingCourse.id}`)
      toast.success('Course deleted successfully')
      setShowDeleteDialog(false)
      setDeletingCourse(null)
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error(error.response?.data?.error || 'Failed to delete course')
    }
  }

  const handleToggleStatus = async (courseId) => {
    try {
      await axios.patch(`/api/courses/${courseId}/toggle-status`)
      toast.success('Course status updated')
      fetchCourses()
    } catch (error) {
      console.error('Error toggling course status:', error)
      toast.error('Failed to update course status')
    }
  }

  const openEditForm = (course) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const openDeleteDialog = (course) => {
    setDeletingCourse(course)
    setShowDeleteDialog(true)
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="mt-2 text-gray-600">
              Manage your course catalog and pricing
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Courses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          [...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No courses found</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4"
            >
              Add Your First Course
            </button>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {course.name}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(course.isActive)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="font-medium">${parseFloat(course.price).toFixed(2)}</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{course._count?.enrollments || 0} students enrolled</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditForm(course)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="Edit course"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(course.id)}
                      className={`p-1 ${
                        course.isActive 
                          ? 'text-warning-600 hover:text-warning-700' 
                          : 'text-success-600 hover:text-success-700'
                      }`}
                      title={course.isActive ? 'Deactivate course' : 'Activate course'}
                    >
                      {course.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <button
                    onClick={() => openDeleteDialog(course)}
                    className="text-danger-600 hover:text-danger-900 p-1"
                    title="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={editingCourse}
          onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
          onCancel={() => {
            setShowForm(false)
            setEditingCourse(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Course"
          message={`Are you sure you want to delete "${deletingCourse?.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteCourse}
          onCancel={() => {
            setShowDeleteDialog(false)
            setDeletingCourse(null)
          }}
        />
      )}
    </div>
  )
}

export default Courses


