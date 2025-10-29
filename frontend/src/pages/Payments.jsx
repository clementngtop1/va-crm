import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PaymentForm from '../components/PaymentForm'
import SearchBar from '../components/SearchBar'

function Payments() {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/payments')
      const payments = response.data.payments
      setPayments(payments)
      setFilteredPayments(payments)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = (payments, query, methodFilter) => {
    let filtered = [...payments]

    // Filter by search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ')
      filtered = filtered.filter(payment => {
        const searchableText = [
          payment.student?.name,
          payment.student?.email,
          payment.student?.contact,
          payment.enrollment?.course?.name
        ].map(text => text?.toLowerCase() || '').join(' ')

        return searchTerms.every(term => searchableText.includes(term))
      })
    }

    // Filter by payment method
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter)
    }

    // Sort by date in descending order (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.date)
      const dateB = new Date(b.updatedAt || b.date)
      return dateB - dateA
    })

    return filtered
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setFilteredPayments(filterPayments(payments, query, paymentMethodFilter))
  }

  const handlePaymentMethodFilter = (method) => {
    setPaymentMethodFilter(method)
    setFilteredPayments(filterPayments(payments, searchQuery, method))
  }

  const getPaymentMethodIcon = (method) => {
    const methodConfig = {
      CASH: { icon: DollarSign, class: 'text-success-500' },
      BANK_TRANSFER: { icon: TrendingUp, class: 'text-primary-500' },
      CREDIT_CARD: { icon: CreditCard, class: 'text-warning-500' },
      DEBIT_CARD: { icon: CreditCard, class: 'text-info-500' },
      ONLINE_PAYMENT: { icon: TrendingUp, class: 'text-primary-500' },
      CHECK: { icon: DollarSign, class: 'text-gray-500' }
    }
    
    const config = methodConfig[method] || methodConfig.CASH
    const Icon = config.icon
    return <Icon className={`h-4 w-4 ${config.class}`} />
  }

  const getPaymentMethodText = (method) => {
    return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="mt-2 text-gray-600">
              Track student payments and outstanding amounts
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
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
                value={paymentMethodFilter || 'all'}
                onChange={(e) => handlePaymentMethodFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="ONLINE_PAYMENT">Online Payment</option>
                <option value="CHECK">Check</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <DollarSign className="mx-auto h-8 w-8 text-success-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              ${payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <CreditCard className="mx-auto h-8 w-8 text-primary-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {payments.length}
            </div>
            <div className="text-sm text-gray-500">Total Payments</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Users className="mx-auto h-8 w-8 text-info-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {new Set(payments.map(p => p.studentId)).size}
            </div>
            <div className="text-sm text-gray-500">Students Paid</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Calendar className="mx-auto h-8 w-8 text-warning-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {new Date().getMonth() + 1}
            </div>
            <div className="text-sm text-gray-500">Current Month</div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded mb-3"></div>
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              {searchQuery ? (
                <p className="mt-4 text-gray-500">No payments found matching "{searchQuery}"</p>
              ) : (
                <>
                  <p className="mt-4 text-gray-500">No payments found</p>
                  <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
                    Record First Payment
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Course</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Method</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Notes</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredPayments.slice(0, 10).map((payment) => (
                    <tr key={payment.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {payment.student.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.enrollment.course.name}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm font-medium text-success-600">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(payment.method)}
                          <span className="text-sm text-gray-900">
                            {getPaymentMethodText(payment.method)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {payment.notes || '-'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => { setEditingPayment(payment); setShowForm(true) }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPayments.length > 10 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing first 10 of {filteredPayments.length} payments
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <PaymentForm
          payment={editingPayment}
          onSubmitSuccess={() => { setShowForm(false); setEditingPayment(null); fetchPayments() }}
          onCancel={() => { setShowForm(false); setEditingPayment(null) }}
        />
      )}

      {/* Coming Soon Notice */}
      {/*
      <div className="mt-8 card">
        <div className="card-body text-center">
          <CreditCard className="mx-auto h-12 w-12 text-primary-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Full Payment Management Coming Soon
          </h3>
          <p className="text-gray-600 mb-4">
            This page will include complete payment management features:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Record new payments</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Payment tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Outstanding amounts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Payment reports</span>
            </div>
          </div>
        </div>
      </div>*/}
    </div>
  )
}

export default Payments


