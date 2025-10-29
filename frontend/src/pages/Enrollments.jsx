import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  DollarSign
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import EnrollmentForm from '../components/EnrollmentForm'

function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [filteredEnrollments, setFilteredEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/enrollments')
      const enrollments = response.data.enrollments
      setEnrollments(enrollments)
      setFilteredEnrollments(enrollments)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      toast.error('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const filterEnrollments = (enrollments, query, status) => {
    let filtered = [...enrollments]

    // Filter by search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ')
      filtered = filtered.filter(enrollment => {
        const searchableText = [
          enrollment.student?.name,
          enrollment.student?.email,
          enrollment.student?.contact,
          enrollment.course?.name
        ].map(text => text?.toLowerCase() || '').join(' ')

        return searchTerms.every(term => searchableText.includes(term))
      })
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === status)
    }

    return filtered
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setFilteredEnrollments(filterEnrollments(enrollments, query, statusFilter))
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setFilteredEnrollments(filterEnrollments(enrollments, searchQuery, status))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { class: 'badge-success', text: 'Active' },
      COMPLETED: { class: 'badge-info', text: 'Completed' },
      CANCELLED: { class: 'badge-danger', text: 'Cancelled' },
      SUSPENDED: { class: 'badge-warning', text: 'Suspended' }
    }
    
    const config = statusConfig[status] || statusConfig.ACTIVE
    return <span className={`badge ${config.class}`}>{config.text}</span>
  }

  const getPaymentStatus = (enrollment) => {
    const totalPaid = enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
    const coursePrice = parseFloat(enrollment.course.price)
    const outstanding = Math.max(0, coursePrice - totalPaid)
    
    if (outstanding === 0) return <span className="text-success-600 font-medium">Fully Paid</span>
    return <span className="text-warning-600 font-medium">Outstanding <br></br>${outstanding.toFixed(2)}</span>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
            <p className="mt-2 text-gray-600">
              Track student enrollments and course progress
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Enrollment
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
                  placeholder="Search by student name, email, contact or course..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-primary-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {enrollments.filter(e => e.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-500">Active Enrollments</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Users className="mx-auto h-8 w-8 text-success-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {enrollments.filter(e => e.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <BookOpen className="mx-auto h-8 w-8 text-info-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {new Set(enrollments.map(e => e.courseId)).size}
            </div>
            <div className="text-sm text-gray-500">Courses</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <DollarSign className="mx-auto h-8 w-8 text-warning-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {enrollments.filter(e => e.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-500">Pending Payments</div>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Enrollments</h3>
          {searchQuery && (
            <p className="mt-1 text-sm text-gray-600">
              Showing results for "{searchQuery}"
            </p>
          )}
        </div>
        <div className="card-body">
          {loading ? (
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded mb-3"></div>
              ))}
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">
                {searchQuery ? `No enrollments found matching "${searchQuery}"` : 'No enrollments found'}
              </p>
              <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
                Create First Enrollment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Course</th>
                    <th className="table-header-cell">Batch</th>
                    <th className="table-header-cell">Start Date</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Payment Remarks</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredEnrollments.slice(0, 10).map((enrollment) => (
                    <tr key={enrollment.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {enrollment.student.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {enrollment.student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.course.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${parseFloat(enrollment.course.price).toFixed(2)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {enrollment.batch || 'N/A'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {new Date(enrollment.startDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(enrollment.status)}
                      </td>
                      <td className="table-cell">
                        {getPaymentStatus(enrollment)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => { setEditingEnrollment(enrollment); setShowForm(true) }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredEnrollments.length > 10 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing first 10 of {filteredEnrollments.length} enrollments
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EnrollmentForm
          enrollment={editingEnrollment}
          onSubmitSuccess={() => { setShowForm(false); setEditingEnrollment(null); fetchEnrollments() }}
          onCancel={() => { setShowForm(false); setEditingEnrollment(null) }}
        />
      )}

      {/* Coming Soon Notice */}
      {/*
      <div className="mt-8 card">
        <div className="card-body text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Full Enrollment Management Coming Soon
          </h3>
          <p className="text-gray-600 mb-4">
            This page will include complete enrollment management features:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Create new enrollments</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Update enrollment status</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Batch management</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Progress tracking</span>
            </div>
          </div>
        </div>
      </div>*/}
    </div>
  )
}

export default Enrollments


