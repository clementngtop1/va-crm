import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2,
  Eye,
  Mail,
  Phone
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import StudentForm from '../components/StudentForm'
import ConfirmDialog from '../components/ConfirmDialog'
import CSVImport from '../components/CSVImport'

function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    course: '',
    status: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState(null)
  const [showCSVImport, setShowCSVImport] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [searchTerm, filters, pagination.page])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.course && { course: filters.course }),
        ...(filters.status && { status: filters.status })
      })

      const response = await axios.get(`/api/students?${params}`)
      setStudents(response.data.students)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (formData) => {
    try {
      // Build composite payload
      const student = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nricPassportId: formData.nricPassportId,
        address: formData.address || undefined,
        remarks: formData.remarks || undefined,
      }

      const enrollment = formData.createEnrollment && formData.enrollmentCourseId ? {
        courseId: formData.enrollmentCourseId,
        batch: formData.enrollmentBatch || undefined,
        startDate: formData.enrollmentStartDate || undefined,
        status: 'ACTIVE',
        notes: formData.enrollmentNotes || undefined,
      } : undefined

      const payment = formData.createPayment && formData.paymentAmount ? {
        amount: formData.paymentAmount,
        date: formData.paymentDate || new Date().toISOString().slice(0,10),
        method: formData.paymentMethod || 'CASH',
        notes: formData.paymentNotes || undefined,
        applyTo: 'enrollment'
      } : undefined

      const payload = { student, enrollment, payment }

      const fd = new window.FormData()
      fd.append('data', JSON.stringify(payload))
      const files = formData.documentsFiles instanceof FileList ? Array.from(formData.documentsFiles) : []
      files.forEach(f => fd.append('docs', f))

      await axios.post('/api/students/full-create', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Student created successfully')
      setShowForm(false)
      fetchStudents()
    } catch (error) {
      console.error('Error creating student:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create student'
      toast.error(errorMessage)
      // Don't close the form on error to preserve user data
    }
  }

  const handleUpdateStudent = async (studentData) => {
    try {
      await axios.put(`/api/students/${editingStudent.id}`, studentData)
      toast.success('Student updated successfully')
      setShowForm(false)
      setEditingStudent(null)
      fetchStudents()
    } catch (error) {
      console.error('Error updating student:', error)
      toast.error(error.response?.data?.error || 'Failed to update student')
    }
  }

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return

    try {
      await axios.delete(`/api/students/${deletingStudent.id}`)
      toast.success('Student deleted successfully')
      setShowDeleteDialog(false)
      setDeletingStudent(null)
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error(error.response?.data?.error || 'Failed to delete student')
    }
  }

  const handleCSVImport = async (studentsData) => {
    try {
      await axios.post('/api/students/bulk-import', { students: studentsData })
      toast.success('Students imported successfully')
      setShowCSVImport(false)
      fetchStudents()
    } catch (error) {
      console.error('Error importing students:', error)
      toast.error(error.response?.data?.error || 'Failed to import students')
    }
  }

  const openEditForm = (student) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  const openDeleteDialog = (student) => {
    setDeletingStudent(student)
    setShowDeleteDialog(true)
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const getStatusBadge = (enrollments) => {
    if (enrollments.length === 0) return <span className="badge badge-info">No Enrollments</span>
    
    const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE')
    if (activeEnrollments.length > 0) return <span className="badge badge-success">Active</span>
    
    const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED')
    if (completedEnrollments.length > 0) return <span className="badge badge-info">Completed</span>
    
    return <span className="badge badge-warning">Inactive</span>
  }

  const getPaymentStatus = (enrollments) => {
    if (enrollments.length === 0) return 'No enrollments'
    
    let totalOutstanding = 0
    let totalPaid = 0
    
    enrollments.forEach(enrollment => {
      const coursePrice = parseFloat(enrollment.course.price)
      const payments = enrollment.payments || []
      const paid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      totalPaid += paid
      totalOutstanding += Math.max(0, coursePrice - paid)
    })
    
    if (totalOutstanding === 0) return <span className="text-success-600 font-medium">Fully Paid</span>
    return <span className="text-warning-600 font-medium">- ${totalOutstanding.toFixed(2)}</span>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="mt-2 text-gray-600">
              Manage your student database and enrollments
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCSVImport(true)}
              className="btn btn-outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
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
                  placeholder="Search students by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filters.course}
                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                className="input"
              >
                <option value="">All Courses</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Mobile Development">Mobile Development</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded mb-3"></div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No students found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                Add Your First Student
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Student</th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Enrollments</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Payment Remarks</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {students.map((student) => (
                      <tr key={student.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">ID: {student.id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">{student.email}</div>
                          <div className="text-sm text-gray-500">{student.phone}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {student.enrollments?.length || 0} courses
                          </div>
                          {student.enrollments?.map(enrollment => (
                            <div key={enrollment.id} className="text-sm text-gray-500">
                              {enrollment.course.name}
                            </div>
                          ))}
                        </td>
                        <td className="table-cell">
                          {getStatusBadge(student.enrollments || [])}
                        </td>
                        <td className="table-cell">
                          {getPaymentStatus(student.enrollments || [])}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/students/${student.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => openEditForm(student)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(student)}
                              className="text-danger-600 hover:text-danger-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
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
            </>
          )}
        </div>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent}
          onCancel={() => {
            setShowForm(false)
            setEditingStudent(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Student"
          message={`Are you sure you want to delete ${deletingStudent?.name}? This action cannot be undone.`}
          onConfirm={handleDeleteStudent}
          onCancel={() => {
            setShowDeleteDialog(false)
            setDeletingStudent(null)
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImport
          onImport={handleCSVImport}
          onCancel={() => setShowCSVImport(false)}
          templateEndpoint="/api/upload/template"
          previewEndpoint="/api/upload/csv-preview"
        />
      )}
    </div>
  )
}

export default Students


