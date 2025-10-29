import { useState, useEffect } from 'react'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar
} from 'lucide-react'
import PaymentForm from '../components/PaymentForm'
import { format } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'

const StatCard = ({ title, value, icon: Icon, change, changeType, className = '' }) => (
  <div className={`card ${className}`}>
    <div className="card-body">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
      {change && (
        <div className="mt-4">
          <div className={`flex items-center text-sm ${
            changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
          }`}>
            {changeType === 'positive' ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {change}
          </div>
        </div>
      )}
    </div>
  </div>
)

const RecentActivity = ({ title, items, emptyMessage, type = 'enrollment', onEditPayment }) => (
  <div className="card">
    <div className="card-header">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    </div>
    <div className="card-body">
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            // Handle different data structures for enrollments vs payments
            const studentName = item.student?.name || item.name || 'Unknown'
            const courseName = type === 'payment' 
              ? item.enrollment?.course?.name || 'No course'
              : item.course?.name || 'No course'
            const displayValue = type === 'payment' 
              ? `$${parseFloat(item.amount).toLocaleString()}`
              : format(new Date(item.createdAt), 'MMM d')
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {studentName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {studentName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {courseName}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{displayValue}</span>
                  {type === 'payment' }
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  </div>
)

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/dashboard/overview')
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    )
  }

  const { overview, recentEnrollments, recentPayments, courseEnrollments, monthlyRevenue } = dashboardData

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your education business performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={overview.totalStudents}
          icon={Users}
          change={`+${overview.totalStudents > 0 ? Math.floor(overview.totalStudents * 0.1) : 0} this month`}
          changeType="positive"
        />
        <StatCard
          title="Active Enrollments"
          value={overview.activeEnrollments}
          icon={GraduationCap}
          change={`${overview.completedEnrollments} completed`}
          changeType="positive"
        />
        <StatCard
          title="Total Revenue"
          value={`$${overview.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          change={`$${overview.outstandingAmount.toLocaleString()} outstanding`}
          changeType="warning"
        />
        <StatCard
          title="Active Courses"
          value={overview.activeCourses}
          icon={BookOpen}
          change={`${overview.totalCourses} total`}
          changeType="info"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <RecentActivity
          title="Recent Enrollments"
          items={recentEnrollments}
          emptyMessage="No recent enrollments"
          type="enrollment"
        />

        {/* Recent Payments */}
        <RecentActivity
          title="Recent Payments"
          items={recentPayments}
          emptyMessage="No recent payments"
          type="payment"
          onEditPayment={setSelectedPayment}
        />
        
        {/* Payment Edit Modal */}
        {selectedPayment && (
          <PaymentForm
            payment={selectedPayment}
            onSubmitSuccess={() => {
              setSelectedPayment(null)
              fetchDashboardData()
            }}
            onCancel={() => setSelectedPayment(null)}
          />
        )}
      </div>

      {/* Course Performance */}
      <div className="mt-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Course Performance</h3>
          </div>
          <div className="card-body">
            {courseEnrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No course data available</p>
            ) : (
              <div className="space-y-4">
                {courseEnrollments.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{course.name}</p>
                        <p className="text-sm text-gray-500">{course._count.enrollments} students</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {((course._count.enrollments / overview.totalStudents) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Monthly Revenue (Last 6 Months)</h3>
            </div>
            <div className="card-body">
              <div className="h-64 flex items-end space-x-2">
                {monthlyRevenue.map((month, index) => {
                  const maxAmount = Math.max(...monthlyRevenue.map(m => m.amount))
                  const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
                  
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary-500 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        {format(new Date(month.month), 'MMM yy')}
                      </div>
                      <div className="text-xs font-medium text-gray-900 mt-1">
                        ${month.amount.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard


