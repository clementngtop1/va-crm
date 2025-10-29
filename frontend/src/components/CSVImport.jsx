import { useState } from 'react'
import { Upload, Download, X, Check, AlertCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function CSVImport({ onImport, onCancel, templateEndpoint, previewEndpoint }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('upload') // upload, preview, confirm

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      handleFileUpload(selectedFile)
    } else {
      toast.error('Please select a valid CSV file')
    }
  }

  const handleFileUpload = async (selectedFile) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await axios.post(previewEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setPreview(response.data)
      setStep('preview')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to process CSV file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview?.preview) return

    setLoading(true)
    try {
      await onImport(preview.preview)
      setStep('upload')
      setFile(null)
      setPreview(null)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(templateEndpoint, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'students-template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setStep('upload')
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Import Students from CSV</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Step 1: Download Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download our CSV template to ensure your data is formatted correctly.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="btn btn-outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Step 2: Upload CSV File</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your CSV file with student information. The file should include columns for name, email, and phone.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="csv-file" className="btn btn-primary cursor-pointer">
                      Choose CSV File
                    </label>
                    <input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    CSV files only, max 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Step 3: Review Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review the parsed data before importing. {preview.validRows} rows are valid, {preview.errorRows} rows have errors.
                </p>
                
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{preview.totalRows}</div>
                    <div className="text-sm text-gray-500">Total Rows</div>
                  </div>
                  <div className="text-center p-3 bg-success-50 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">{preview.validRows}</div>
                    <div className="text-sm text-success-500">Valid Rows</div>
                  </div>
                  <div className="text-center p-3 bg-danger-50 rounded-lg">
                    <div className="text-2xl font-bold text-danger-600">{preview.errorRows}</div>
                    <div className="text-sm text-danger-500">Error Rows</div>
                  </div>
                </div>

                {/* Preview Table */}
                {preview.preview.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.preview.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.email}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.phone}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.course || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.preview.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Showing first 5 rows of {preview.preview.length} valid rows
                      </p>
                    )}
                  </div>
                )}

                {/* Errors */}
                {preview.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Errors Found:</h4>
                    <div className="space-y-2">
                      {preview.errors.slice(0, 3).map((error, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-danger-50 rounded">
                          <AlertCircle className="h-4 w-4 text-danger-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-danger-700">
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </div>
                        </div>
                      ))}
                      {preview.errors.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          And {preview.errors.length - 3} more errors...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={resetForm}
                  className="btn btn-outline"
                >
                  Upload Different File
                </button>
                <div className="space-x-3">
                  <button
                    onClick={onCancel}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading || preview.validRows === 0}
                    className="btn btn-primary"
                  >
                    {loading ? 'Importing...' : `Import ${preview.validRows} Students`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CSVImport


