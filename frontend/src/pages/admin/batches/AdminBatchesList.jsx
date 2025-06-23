import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { batchesAPI, departmentsAPI } from '../../../services/api'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

const AdminBatchesList = () => {
  const navigate = useNavigate()
  const [batches, setBatches] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [batchesRes, departmentsRes] = await Promise.all([
        batchesAPI.getBatches(),
        departmentsAPI.getDepartments()
      ])
      
      setBatches(batchesRes.data || [])
      setDepartments(departmentsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (batchId, batchName) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batchName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleteLoading(batchId)
      await batchesAPI.deleteBatch(batchId)
      toast.success('Batch deleted successfully')
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast.error('Failed to delete batch')
    } finally {
      setDeleteLoading(null)
    }
  }

  // Filter batches based on search and department
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.section.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !selectedDepartment || 
                             batch.course?.department?._id === selectedDepartment

    return matchesSearch && matchesDepartment
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
              <p className="mt-2 text-gray-600">Manage all batches and assign teachers</p>
            </div>
            <Link
              to="/admin/batches/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Batch
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedDepartment ? 'Try adjusting your filters' : 'Get started by creating your first batch'}
            </p>
            <Link
              to="/admin/batches/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Batch
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div key={batch._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Batch Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {batch.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {batch.course?.name} - Section {batch.section}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      batch.isFinished 
                        ? 'bg-gray-100 text-gray-800'
                        : batch.isArchived
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {batch.isFinished ? 'Finished' : batch.isArchived ? 'Archived' : 'Active'}
                    </span>
                  </div>

                  {/* Batch Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      {batch.course?.department?.name}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      {batch.academicYear}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {batch.timing}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Teacher: {batch.createdBy?.name || 'Not Assigned'}
                    </div>
                  </div>

                  {/* Student Count */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Students</span>
                    <span className="text-sm text-gray-600">
                      {batch.studentCount || 0} / {batch.maxStudents}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/batches/${batch._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <Link
                        to={`/admin/batches/${batch._id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                    <button
                      onClick={() => handleDelete(batch._id, batch.name)}
                      disabled={deleteLoading === batch._id}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteLoading === batch._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBatchesList
