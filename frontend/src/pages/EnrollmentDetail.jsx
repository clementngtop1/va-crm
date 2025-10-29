import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  GraduationCap, 
  Users, 
  DollarSign,
  Calendar,
  Edit,
  CreditCard,
  BookOpen
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function EnrollmentDetail() {
  const { id } = useParams()
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnrollment()
  }, [id])

  const fetchEnrollment = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/enrollments/${id}`)
      setEnrollment(response.data)
    } catch (error) {
      console.error('Error fetching enrollment:', error)
      toast.error('Failed to load enrollment details')
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

  if (!enrollment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Enrollment not found</p>
        <Link to="/enrollments" className="btn btn-primary">
          Back to Enrollments
        </Link>
      </div>
    )
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

  const getPaymentStatus = () => {
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
          <Link to="/enrollments" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollment Details</h1>
            <p className="mt-2 text-gray-600">
              {enrollment.student.name} - {enrollment.course.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrollment Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Enrollment Information</h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-6">
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-10 w-10 text-primary-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Enrollment #{enrollment.id.slice(-8)}</h4>
                <div className="mt-2">
                  {getStatusBadge(enrollment.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Student</p>
                    <p className="text-sm text-gray-600">{enrollment.student.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Course</p>
                    <p className="text-sm text-gray-600">{enrollment.course.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Course Price</p>
                    <p className="text-sm text-gray-600">
                      ${parseFloat(enrollment.course.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {enrollment.batch && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Batch</p>
                      <p className="text-sm text-gray-600">{enrollment.batch}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Start Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(enrollment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {enrollment.endDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">End Date</p>
                      <p className="text-sm text-gray-600">
                        {new Date(enrollment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enrolled On</p>
                    <p className="text-sm text-gray-600">
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="btn btn-outline w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Enrollment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    ${parseFloat(enrollment.course.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Course Price</div>
                </div>
                
                <div className="text-center p-4 bg-success-50 rounded-lg">
                  <CreditCard className="mx-auto h-8 w-8 text-success-500 mb-2" />
                  <div className="text-2xl font-bold text-success-600">
                    ${enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-success-500">Total Paid</div>
                </div>
                
                <div className="text-center p-4 bg-warning-50 rounded-lg">
                  <DollarSign className="mx-auto h-8 w-8 text-warning-500 mb-2" />
                  <div className="text-2xl font-bold text-warning-600">
                    ${Math.max(0, parseFloat(enrollment.course.price) - (enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0)).toFixed(2)}
                  </div>
                  <div className="text-sm text-warning-500">Outstanding</div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="text-lg font-medium text-gray-900 mb-2">Payment Status</div>
                <div className="text-xl">
                  {getPaymentStatus()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
            </div>
            <div className="card-body">
              {enrollment.payments?.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No payments recorded yet</p>
                  <button className="btn btn-primary">Record Payment</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollment.payments?.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ${parseFloat(payment.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {payment.method.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(payment.date).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      {payment.notes && (
                        <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                          <span className="font-medium">Notes:</span> {payment.notes}
                        </div>
                      )}
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

export default EnrollmentDetail


