import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Teacher Project Components
import SimpleProjectDashboard from '../../pages/teacher/projects/SimpleProjectDashboard'
import SimpleProjectAssign from '../../pages/teacher/projects/SimpleProjectAssign'
import SimpleProjectManage from '../../pages/teacher/projects/SimpleProjectManage'
import SimpleProjectEdit from '../../pages/teacher/projects/SimpleProjectEdit'
import TeacherProjectSubmissions from '../../pages/teacher/projects/TeacherProjectSubmissions'
import ProjectAnalytics from '../../pages/admin/projects/ProjectAnalytics'
import SimpleProjectAnalytics from '../../pages/teacher/projects/SimpleProjectAnalytics'

// Student Project Components
import StudentProjectDashboard from '../../pages/student/projects/StudentProjectDashboard'
import StudentProjectDetails from '../../pages/student/projects/StudentProjectDetails'
import StudentProjectSubmit from '../../pages/student/projects/StudentProjectSubmit'

const RoleBasedProjectRoutes = () => {
  const { user } = useAuth()

  if (user?.role === 'teacher' || user?.role === 'admin') {
    return (
      <Routes>
        <Route index element={<SimpleProjectDashboard />} />
        <Route path="assign/:batchId" element={<SimpleProjectAssign />} />
        <Route path="edit/:projectId" element={<SimpleProjectEdit />} />
        <Route path=":projectId/manage" element={<SimpleProjectManage />} />
        <Route path=":projectId/submissions" element={<TeacherProjectSubmissions />} />
        <Route path=":projectId/results" element={<ProjectAnalytics />} />
        <Route path=":projectId/analytics" element={<SimpleProjectAnalytics />} />
      </Routes>
    )
  }

  // Student routes
  return (
    <Routes>
      <Route index element={<StudentProjectDashboard />} />
      <Route path=":projectId" element={<StudentProjectDetails />} />
      <Route path=":projectId/submit" element={<StudentProjectSubmit />} />
    </Routes>
  )
}

export default RoleBasedProjectRoutes
