import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function StudentForm({ student, onSubmit, onCancel }) {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm()

  useEffect(() => {
    if (student) {
      setValue('name', student.name)
      setValue('email', student.email)
      setValue('phone', student.phone)
    }
  }, [student, setValue])

  const handleFormSubmit = async (data) => {
    setLoading(true)
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      // Error handling is done in parent component
      // Don't reset form on error to preserve user data
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { 
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className={`input mt-1 ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`input mt-1 ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone', { 
                  required: 'Phone number is required',
                  minLength: { value: 10, message: 'Phone number must be at least 10 digits' }
                })}
                className={`input mt-1 ${errors.phone ? 'input-error' : ''}`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="nricPassportId" className="block text-sm font-medium text-gray-700">
                NRIC / Passport ID *
              </label>
              <input
                type="text"
                id="nricPassportId"
                {...register('nricPassportId', { required: 'NRIC/Passport is required' })}
                className={`input mt-1 ${errors.nricPassportId ? 'input-error' : ''}`}
                placeholder="Enter NRIC/Passport ID"
              />
              {errors.nricPassportId && (
                <p className="mt-1 text-sm text-danger-600">{errors.nricPassportId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                {...register('address')}
                className="input mt-1"
                placeholder="Enter address (optional)"
              />
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea id="remarks" rows={3} {...register('remarks')} className="input mt-1" placeholder="Remarks (optional)" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Documents</label>
              <input type="file" multiple className="mt-1" {...register('documentsFiles')} />
              <p className="text-xs text-gray-500 mt-1">You can attach multiple files</p>
            </div>
          </div>

          {/* Enrollment & Payment toggles */}
          {!student && (
            <div className="mt-6 space-y-4">
              <CreateEnrollmentFields register={register} errors={errors} />
              <CreatePaymentFields register={register} errors={errors} />
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateEnrollmentFields({ register }) {
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState([])
  useEffect(() => { if (open) axios.get('/api/courses?active=true&limit=200').then(r => setCourses(r.data.courses || [])).catch(()=>{}) }, [open])
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="createEnrollment" {...register('createEnrollment')} onChange={e=>setOpen(e.target.checked)} />
          <label htmlFor="createEnrollment" className="text-sm font-medium text-gray-700">Create initial enrollment</label>
        </div>
      </div>
      {open && (
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Course *</label>
            <select className="input mt-1" {...register('enrollmentCourseId')}>
              <option value="">Select course</option>
              {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch</label>
            <input className="input mt-1" {...register('enrollmentBatch')} placeholder="Batch" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" className="input mt-1" {...register('enrollmentStartDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input className="input mt-1" {...register('enrollmentNotes')} />
          </div>
        </div>
      )}
    </div>
  )
}

function CreatePaymentFields({ register }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="createPayment" {...register('createPayment')} onChange={e=>setOpen(e.target.checked)} />
          <label htmlFor="createPayment" className="text-sm font-medium text-gray-700">Record initial payment</label>
        </div>
      </div>
      {open && (
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input type="number" step="0.01" className="input mt-1" {...register('paymentAmount')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" className="input mt-1" {...register('paymentDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Method</label>
            <select className="input mt-1" {...register('paymentMethod')}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="ONLINE_PAYMENT">Online Payment</option>
              <option value="CHECK">Check</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input className="input mt-1" {...register('paymentNotes')} />
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentForm


