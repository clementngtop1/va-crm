import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  Users, 
  BookOpen, 
  CreditCard,
  Mail,
  Phone,
  Calendar,
  Edit
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import EnrollmentForm from '../components/EnrollmentForm'
import PaymentForm from '../components/PaymentForm'

function StudentDetail() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  useEffect(() => {
    fetchStudent()
  }, [id])

  const fetchStudent = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/students/${id}`)
      setStudent(response.data)
    } catch (error) {
      console.error('Error fetching student:', error)
      toast.error('Failed to load student details')
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

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Student not found</p>
        <Link to="/students" className="btn btn-primary">
          Back to Students
        </Link>
      </div>
    )
  }

  const getStatusBadge = (enrollment) => {
    const statusConfig = {
      ACTIVE: { class: 'badge-success', text: 'Active' },
      COMPLETED: { class: 'badge-info', text: 'Completed' },
      CANCELLED: { class: 'badge-danger', text: 'Cancelled' },
      SUSPENDED: { class: 'badge-warning', text: 'Suspended' }
    }
    
    const config = statusConfig[enrollment.status] || statusConfig.ACTIVE
    return <span className={`badge ${config.class}`}>{config.text}</span>
  }

  const getPaymentStatus = (enrollment) => {
    const totalPaid = enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
    const coursePrice = parseFloat(enrollment.course.price)
    const outstanding = Math.max(0, coursePrice - totalPaid)
    
    if (outstanding === 0) return <span className="text-success-600 font-medium">Fully Paid</span>
    return <span className="text-warning-600 font-medium">${outstanding.toFixed(2)} Outstanding</span>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/students" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="mt-2 text-gray-600">Student Profile & Enrollments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Student Information</h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-6">
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">
                    {student.name.charAt(0)}
                  </span>
                </div>
                <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                <p className="text-sm text-gray-500">Student ID: {student.id.slice(-8)}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{student.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Joined</p>
                    <p className="text-sm text-gray-600">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="btn btn-outline w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Student
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollments */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Enrollments</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowEnrollmentForm(true)}>Add Enrollment</button>
              </div>
            </div>
            <div className="card-body">
              {student.enrollments?.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No enrollments yet</p>
                  <button className="btn btn-primary" onClick={() => setShowEnrollmentForm(true)}>Enroll in Course</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {student.enrollments?.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {enrollment.course.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ${parseFloat(enrollment.course.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(enrollment)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                          <p className="text-gray-500">Payment Status</p>
                          <div className="font-medium">
                            {getPaymentStatus(enrollment)}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Paid</p>
                          <p className="font-medium text-success-600">
                            ${enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentForm(true)}>Record Payment</button>
              </div>
            </div>
            <div className="card-body">
              {student.payments?.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {student.payments?.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.enrollment?.course?.name || 'Unknown Course'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-success-600">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {payment.method.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {student.payments?.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        Showing 5 of {student.payments.length} payments
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEnrollmentForm && (
        <EnrollmentForm
          defaultStudentId={student.id}
          onSubmitSuccess={() => { setShowEnrollmentForm(false); fetchStudent() }}
          onCancel={() => setShowEnrollmentForm(false)}
        />
      )}

      {showPaymentForm && (
        <PaymentForm
          defaultStudentId={student.id}
          onSubmitSuccess={() => { setShowPaymentForm(false); fetchStudent() }}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  )
}

export default StudentDetail


