import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  StarIcon,
  TagIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { coursesAPI, departmentsAPI } from '../../../services/api';
import BackButton from '../../../components/BackButton';

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, course: null });
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const categories = [
    'Design', 'Programming', 'Web Development', 'Mobile Development',
    'Data Science', 'Digital Marketing', 'Graphics', 'Animation', 'CAD', 'Other'
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle URL parameters for department filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const departmentParam = urlParams.get('department');
    if (departmentParam) {
      setSelectedDepartment(departmentParam);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedDepartment, selectedLevel, selectedCategory, showActiveOnly, pagination.page]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments({ active: true });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};

      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedLevel) params.level = selectedLevel;
      if (selectedCategory) params.category = selectedCategory;
      if (showActiveOnly) params.active = 'true';
      if (searchTerm) params.search = searchTerm;

      params.page = pagination.page.toString();
      params.limit = pagination.limit.toString();

      const response = await coursesAPI.getCourses(params);
      setCourses(response.data.courses || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (course) => {
    setDeleteModal({ show: true, course });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.course) return;

    try {
      setDeleting(true);
      await coursesAPI.deleteCourse(deleteModal.course._id);
      toast.success('Course deleted successfully!');
      setDeleteModal({ show: false, course: null });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, course: null });
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedLevel('');
    setSelectedCategory('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
  {/* Back Button */}
  <div className="flex items-center">
    <BackButton className="text-sm md:text-base" />
  </div>

  {/* Header - Stacked on mobile */}
  <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10 pointer-events-none"></div>
    <div className="relative px-4 py-8 md:px-8 md:py-12 z-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
            {selectedDepartment && departments.find(d => d._id === selectedDepartment)
              ? `${departments.find(d => d._id === selectedDepartment)?.name} Courses`
              : 'Course Management'
            }
          </h1>
          <p className="text-base md:text-xl text-gray-300 mb-3 md:mb-4">
            {selectedDepartment && departments.find(d => d._id === selectedDepartment)
              ? `Manage courses for ${departments.find(d => d._id === selectedDepartment)?.name} department`
              : 'Manage courses across all departments'
            }
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-gray-400">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 md:mr-2"></div>
              {courses.length} Courses
            </span>
            <span className="hidden md:block">•</span>
            <span className="flex items-center">
              <AcademicCapIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Professional Training Programs
            </span>
          </div>
        </div>
        <div className="hidden lg:block">
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-lg md:rounded-xl shadow hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
          >
            <PlusIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            Add Course
          </Link>
        </div>
      </div>
    </div>
  </div>

  {/* Filters and Actions - Stacked on mobile */}
  <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      <div className="md:col-span-2 lg:col-span-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Search Courses</label>
        <div className="relative">
          <MagnifyingGlassIcon className="h-4 w-4 md:h-5 md:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 w-full border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-all duration-200 text-sm md:text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
          <BuildingOfficeIcon className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
          Department
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="w-full border border-gray-300 rounded-lg md:rounded-xl px-2 md:px-3 py-2 md:py-3 focus:ring-2 focus:ring-cadd-red focus:border-transparent text-sm md:text-base"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
          <StarIcon className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
          Level
        </label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full border border-gray-300 rounded-lg md:rounded-xl px-2 md:px-3 py-2 md:py-3 focus:ring-2 focus:ring-cadd-red focus:border-transparent text-sm md:text-base"
        >
          <option value="">All Levels</option>
          {levels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
          <TagIcon className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-lg md:rounded-xl px-2 md:px-3 py-2 md:py-3 focus:ring-2 focus:ring-cadd-red focus:border-transparent text-sm md:text-base"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
      <div className="flex flex-col md:flex-row gap-3 md:gap-6 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activeOnly"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="rounded border-gray-300 text-cadd-red focus:ring-cadd-red h-4 w-4"
          />
          <label htmlFor="activeOnly" className="text-xs md:text-sm text-gray-700 font-medium">
            Active courses only
          </label>
        </div>

        <div className="lg:hidden">
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 text-xs md:text-sm"
          >
            <PlusIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Add Course
          </Link>
        </div>
      </div>

      <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-normal">
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 md:px-4 md:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-xs md:text-sm"
        >
          Clear Filters
        </button>
        <button
          onClick={handleSearch}
          className="bg-gradient-to-r from-cadd-red to-cadd-pink text-white px-4 py-1.5 md:px-6 md:py-2 rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 flex items-center gap-1 md:gap-2 text-xs md:text-sm"
        >
          <FunnelIcon className="h-3 w-3 md:h-4 md:w-4" />
          Apply
        </button>
      </div>
    </div>

    {/* Stats - Smaller on mobile */}
    <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-gray-600">
      <span className="flex items-center">
        <AcademicCapIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
        Total: {pagination.total}
      </span>
      <span className="flex items-center">
        <CheckCircleIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-500" />
        Active: {courses.filter(c => c.isActive).length}
      </span>
      <span className="flex items-center">
        <XCircleIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 text-red-500" />
        Inactive: {courses.filter(c => !c.isActive).length}
      </span>
    </div>
  </div>

  {/* Courses Grid - Single column on mobile */}
  {courses.length === 0 ? (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-12 text-center">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
        <AcademicCapIcon className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">No courses found</h3>
      <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 max-w-md mx-auto">
        {searchTerm || selectedDepartment || selectedLevel || selectedCategory
          ? 'Try adjusting your search criteria or check the active filter.'
          : 'Get started by creating your first course to offer professional training programs.'
        }
      </p>
      {!searchTerm && !selectedDepartment && !selectedLevel && !selectedCategory && (
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-lg md:rounded-xl shadow hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
        >
          <PlusIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          Create First Course
        </Link>
      )}
    </div>
  ) : (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {courses && courses.length > 0 && courses.map((course, index) => {
          if (!course || !course._id) {
            console.warn('Invalid course object:', course);
            return null;
          }
          return (
            <div
              key={course._id}
              className="group bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Header */}
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="p-2 md:p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg md:rounded-xl shadow">
                      <AcademicCapIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-cadd-red transition-colors line-clamp-2">
                        {course.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 font-medium">
                        Code: {course.code}
                      </p>
                      <p className="text-xs md:text-sm text-blue-600 font-medium">
                        {course.department?.name}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 md:px-3 md:py-1 text-xs font-semibold rounded-full ${
                    course.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="flex items-center text-gray-600">
                      <ClockIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                      Duration:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {course.duration?.months || 'N/A'} months
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="flex items-center text-gray-600">
                      <CurrencyRupeeIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                      Fees:
                    </span>
                    <span className="font-bold text-green-600">
                      ₹{(course.fees?.amount && typeof course.fees.amount === 'number') ? course.fees.amount.toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="flex items-center text-gray-600">
                      <StarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                      Level:
                    </span>
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-gray-100 text-gray-800 rounded-md md:rounded-lg text-xs font-medium">
                      {course.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="flex items-center text-gray-600">
                      <TagIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                      Category:
                    </span>
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-blue-100 text-blue-800 rounded-md md:rounded-lg text-xs font-medium">
                      {course.category}
                    </span>
                  </div>

                  {course.maxStudentsPerBatch && (
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="flex items-center text-gray-600">
                        <UserGroupIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                        Max Students:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {course.maxStudentsPerBatch}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1 md:gap-2">
                  <Link
                    to={`/admin/courses/${course._id}`}
                    className="flex-1 inline-flex items-center justify-center px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm font-medium text-blue-700 bg-blue-50 rounded-md md:rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <EyeIcon className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    View
                  </Link>

                  <Link
                    to={`/admin/courses/${course._id}/edit`}
                    className="inline-flex items-center justify-center p-1 md:p-2 text-gray-600 hover:text-cadd-red hover:bg-gray-50 rounded-md md:rounded-lg transition-colors"
                    title="Edit Course"
                  >
                    <PencilIcon className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteClick(course)}
                    className="inline-flex items-center justify-center p-1 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md md:rounded-lg transition-colors"
                    title="Delete Course"
                  >
                    <TrashIcon className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-1 md:gap-2 mt-4 md:mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md md:rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs md:text-sm"
          >
            Previous
          </button>

          <span className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
            disabled={pagination.page === pagination.pages}
            className="px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md md:rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs md:text-sm"
          >
            Next
          </button>
        </div>
      )}
    </>
  )}

  {/* Delete Confirmation Modal - Responsive */}
  {deleteModal.show && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl max-w-xs sm:max-w-md w-full p-4 md:p-6 transform transition-all">
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 bg-red-100 rounded-full">
          <ExclamationTriangleIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
        </div>

        <h3 className="text-base md:text-lg font-semibold text-gray-900 text-center mb-1 md:mb-2">
          Delete Course
        </h3>

        <p className="text-xs md:text-sm text-gray-600 text-center mb-4 md:mb-6">
          Are you sure you want to delete <strong>{deleteModal.course?.name}</strong>?
          This action cannot be undone and will affect all associated batches and student data.
        </p>

        <div className="flex gap-2 md:gap-3">
          <button
            onClick={handleDeleteCancel}
            disabled={deleting}
            className="flex-1 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="flex-1 px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center text-xs md:text-sm"
          >
            {deleting ? (
              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
};

export default CoursesList;
