import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function PaymentForm({ payment, defaultStudentId, defaultEnrollmentId, onSubmitSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm()

  const selectedStudentId = watch('studentId')

  useEffect(() => {
    fetchStudents()
    setValue('date', new Date().toISOString().slice(0, 10))
    if (defaultStudentId) setValue('studentId', defaultStudentId)
    if (defaultEnrollmentId) setValue('enrollmentId', defaultEnrollmentId)

    // If editing an existing payment, prefill fields
    if (payment) {
      setValue('studentId', payment.studentId)
      setValue('enrollmentId', payment.enrollmentId)
      setValue('amount', parseFloat(payment.amount))
      setValue('method', payment.method)
      setValue('date', payment.date ? payment.date.slice(0,10) : new Date().toISOString().slice(0,10))
      setValue('notes', payment.notes || '')
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment])

  useEffect(() => {
    if (selectedStudentId) fetchEnrollments(selectedStudentId)
  }, [selectedStudentId])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const res = await axios.get('/api/students?limit=100')
      setStudents(res.data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchEnrollments = async (studentId) => {
    try {
      setLoadingEnrollments(true)
      const res = await axios.get(`/api/enrollments?studentId=${studentId}&limit=100`)
      setEnrollments(res.data.enrollments || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      toast.error('Failed to load enrollments')
      setEnrollments([])
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        amount: parseFloat(data.amount),
        method: data.method,
        date: data.date,
        notes: data.notes || undefined
      }
      if (payment) {
        await axios.put(`/api/payments/${payment.id}`, payload)
        toast.success('Payment updated')
      } else {
        await axios.post('/api/payments', payload)
        toast.success('Payment recorded')
      }
      onSubmitSuccess?.()
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to record payment'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Record Payment</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student *</label>
              <select 
                className={`input mt-1 ${errors.studentId ? 'input-error' : ''}`} 
                {...register('studentId', { required: true })}
                disabled={loadingStudents}
              >
                <option value="">{loadingStudents ? 'Loading students...' : 'Select a student'}</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Enrollment *</label>
              <select 
                className={`input mt-1 ${errors.enrollmentId ? 'input-error' : ''}`} 
                {...register('enrollmentId', { required: true })}
                disabled={loadingEnrollments || !selectedStudentId}
              >
                <option value="">
                  {loadingEnrollments ? 'Loading enrollments...' : 
                   !selectedStudentId ? 'Select a student first' : 
                   'Select enrollment'}
                </option>
                {enrollments.map(e => (
                  <option key={e.id} value={e.id}>{e.course.name} — {e.batch || 'No batch'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount *</label>
              <input type="number" step="0.01" min="0.01" className={`input mt-1 ${errors.amount ? 'input-error' : ''}`} {...register('amount', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Method *</label>
              <select className="input mt-1" {...register('method', { required: true })}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="ONLINE_PAYMENT">Online Payment</option>
                <option value="CHECK">Check</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date *</label>
              <input type="date" className={`input mt-1 ${errors.date ? 'input-error' : ''}`} {...register('date', { required: true })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea className="input mt-1" rows={3} placeholder="Optional" {...register('notes')} />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm

