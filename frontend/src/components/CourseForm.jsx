import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'

function CourseForm({ course, onSubmit, onCancel }) {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm()

  useEffect(() => {
    if (course) {
      setValue('name', course.name)
      setValue('description', course.description || '')
      setValue('duration', course.duration || '')
      setValue('price', course.price)
      setValue('isActive', course.isActive)
    }
  }, [course, setValue])

  const handleFormSubmit = async (data) => {
    setLoading(true)
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {course ? 'Edit Course' : 'Add New Course'}
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
                Course Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { 
                  required: 'Course name is required',
                  minLength: { value: 2, message: 'Course name must be at least 2 characters' }
                })}
                className={`input mt-1 ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter course name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description', { 
                  maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                })}
                className={`input mt-1 ${errors.description ? 'input-error' : ''}`}
                placeholder="Enter course description (optional)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <input
                  type="text"
                  id="duration"
                  {...register('duration', { 
                    maxLength: { value: 50, message: 'Duration must be less than 50 characters' }
                  })}
                  className={`input mt-1 ${errors.duration ? 'input-error' : ''}`}
                  placeholder="e.g., 3 months, 6 weeks"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-danger-600">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price *
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 0, message: 'Price must be a positive number' }
                    })}
                    className={`input pl-7 ${errors.price ? 'input-error' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-danger-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active Course</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Active courses can be selected for new enrollments
              </p>
            </div>
          </div>

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
              {loading ? 'Saving...' : (course ? 'Update Course' : 'Add Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CourseForm


