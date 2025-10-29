import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function EnrollmentForm({ enrollment, defaultStudentId, defaultCourseId, onSubmitSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])

  const { register, handleSubmit, formState: { errors }, setValue } = useForm()

  useEffect(() => {
    fetchOptions()
    if (enrollment) {
      setValue('studentId', enrollment.studentId)
      setValue('courseId', enrollment.courseId)
      setValue('batch', enrollment.batch || '')
      setValue('startDate', enrollment.startDate?.slice(0, 10))
      setValue('endDate', enrollment.endDate ? enrollment.endDate.slice(0, 10) : '')
      setValue('status', enrollment.status)
    } else {
      if (defaultStudentId) setValue('studentId', defaultStudentId)
      if (defaultCourseId) setValue('courseId', defaultCourseId)
      setValue('status', 'ACTIVE')
      setValue('startDate', new Date().toISOString().slice(0, 10))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment, defaultStudentId, defaultCourseId])

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true)
      const [studentsRes, coursesRes] = await Promise.all([
        axios.get('/api/students?limit=100'),
        axios.get('/api/courses?limit=100&active=true')
      ])
      setStudents(studentsRes.data.students || [])
      setCourses(coursesRes.data.courses || [])
    } catch (error) {
      console.error('Error fetching options:', error)
      toast.error('Failed to load students and courses')
      setStudents([])
      setCourses([])
    } finally {
      setLoadingOptions(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        studentId: data.studentId,
        courseId: data.courseId,
        batch: data.batch || undefined,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        status: data.status,
      }
      if (enrollment) {
        await axios.put(`/api/enrollments/${enrollment.id}`, payload)
        toast.success('Enrollment updated')
      } else {
        await axios.post('/api/enrollments', payload)
        toast.success('Enrollment created')
      }
      onSubmitSuccess?.()
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to save enrollment'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{enrollment ? 'Edit Enrollment' : 'New Enrollment'}</h2>
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
                disabled={loadingOptions}
              >
                <option value="">{loadingOptions ? 'Loading students...' : 'Select a student'}</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course *</label>
              <select 
                className={`input mt-1 ${errors.courseId ? 'input-error' : ''}`} 
                {...register('courseId', { required: true })}
                disabled={loadingOptions}
              >
                <option value="">{loadingOptions ? 'Loading courses...' : 'Select a course'}</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Batch</label>
              <input className="input mt-1" placeholder="Batch name" {...register('batch')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select className="input mt-1" {...register('status', { required: true })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input type="date" className={`input mt-1 ${errors.startDate ? 'input-error' : ''}`} {...register('startDate', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" className="input mt-1" {...register('endDate')} />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (enrollment ? 'Update' : 'Create Enrollment')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EnrollmentForm

