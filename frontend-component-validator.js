#!/usr/bin/env node

/**
 * Frontend Component Validator
 * Validates all component imports and identifies missing components
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CDC Attendance Frontend Component Validation\n');

// Define expected components based on App.jsx imports
const expectedComponents = [
  // Layouts
  { path: 'src/layouts/AuthLayout.jsx', name: 'AuthLayout' },
  { path: 'src/layouts/AdminLayout.jsx', name: 'AdminLayout' },
  { path: 'src/layouts/TeacherLayout.jsx', name: 'TeacherLayout' },
  
  // Auth Pages
  { path: 'src/pages/auth/Login.jsx', name: 'Login' },
  
  // Admin Pages
  { path: 'src/pages/admin/Dashboard.jsx', name: 'AdminDashboard' },
  { path: 'src/pages/admin/Profile.jsx', name: 'AdminProfile' },
  { path: 'src/pages/admin/TestAPI.jsx', name: 'TestAPI' },
  
  // Admin Sub-pages
  { path: 'src/pages/admin/admins/AdminsList.jsx', name: 'AdminsList' },
  { path: 'src/pages/admin/admins/CreateAdmin.jsx', name: 'CreateAdmin' },
  { path: 'src/pages/admin/admins/AdminDetails.jsx', name: 'AdminDetails' },
  { path: 'src/pages/admin/admins/EditAdmin.jsx', name: 'EditAdmin' },
  
  // Teachers
  { path: 'src/pages/admin/teachers/TeachersList.jsx', name: 'TeachersList' },
  { path: 'src/pages/admin/teachers/TeacherForm.jsx', name: 'TeacherForm' },
  { path: 'src/pages/admin/teachers/TeacherDetails.jsx', name: 'TeacherDetails' },
  
  // Students
  { path: 'src/pages/admin/students/StudentsList.jsx', name: 'StudentsList' },
  { path: 'src/pages/admin/students/StudentForm.jsx', name: 'AdminStudentForm' },
  { path: 'src/pages/admin/students/StudentDetails.jsx', name: 'StudentDetails' },
  
  // Departments
  { path: 'src/pages/admin/departments/DepartmentsList.jsx', name: 'DepartmentsList' },
  { path: 'src/pages/admin/departments/DepartmentForm.jsx', name: 'DepartmentForm' },
  { path: 'src/pages/admin/departments/DepartmentDetails.jsx', name: 'DepartmentDetails' },
  
  // Courses
  { path: 'src/pages/admin/courses/CoursesList.jsx', name: 'CoursesList' },
  { path: 'src/pages/admin/courses/CourseForm.jsx', name: 'CourseForm' },
  { path: 'src/pages/admin/courses/CourseDetails.jsx', name: 'CourseDetails' },
  
  // Batches
  { path: 'src/pages/admin/batches/AdminBatchForm.jsx', name: 'AdminBatchForm' },
  
  // Attendance
  { path: 'src/pages/admin/attendance/AdminAttendanceDashboard.jsx', name: 'AdminAttendanceDashboard' },
  { path: 'src/pages/admin/attendance/AdminAttendanceMark.jsx', name: 'AdminAttendanceMark' },
  { path: 'src/pages/admin/attendance/AdminAttendanceReport.jsx', name: 'AdminAttendanceReport' },
  
  // Lab
  { path: 'src/pages/admin/LabOverview.jsx', name: 'LabOverview' },
  { path: 'src/pages/admin/LabOverviewFixed.jsx', name: 'LabOverviewFixed' },
  { path: 'src/pages/admin/lab/LabManagementSimple.jsx', name: 'LabManagementSimple' },
  { path: 'src/pages/admin/lab/LabDebug.jsx', name: 'LabDebug' },
  { path: 'src/pages/admin/lab/LabBooking.jsx', name: 'LabBooking' },
  { path: 'src/pages/admin/lab/PCForm.jsx', name: 'AdminPCForm' },
  { path: 'src/pages/admin/lab/PCList.jsx', name: 'AdminPCList' },
  { path: 'src/pages/admin/lab/LabControl.jsx', name: 'AdminLabControl' },
  { path: 'src/pages/admin/lab/MaintenancePage.jsx', name: 'AdminMaintenancePage' },
  
  // Notifications
  { path: 'src/pages/admin/notifications/NotificationsList.jsx', name: 'NotificationsList' },
  { path: 'src/pages/admin/notifications/NotificationForm.jsx', name: 'NotificationForm' },
  
  // Teacher Pages
  { path: 'src/pages/teacher/Dashboard.jsx', name: 'TeacherDashboard' },
  { path: 'src/pages/teacher/Profile.jsx', name: 'TeacherProfile' },
  { path: 'src/pages/teacher/AttendancePage.jsx', name: 'AttendancePage' },
  { path: 'src/pages/teacher/LabAvailability.jsx', name: 'LabAvailability' },
  
  // Teacher Sub-pages
  { path: 'src/pages/teacher/students/TeacherStudentsList.jsx', name: 'TeacherStudentsList' },
  { path: 'src/pages/teacher/students/BatchStudents.jsx', name: 'BatchStudents' },
  { path: 'src/pages/teacher/students/StudentForm.jsx', name: 'StudentForm' },
  
  // Teacher Batches
  { path: 'src/pages/teacher/batches/BatchesList.jsx', name: 'BatchesList' },
  { path: 'src/pages/teacher/batches/BatchForm.jsx', name: 'BatchForm' },
  { path: 'src/pages/teacher/batches/BatchDetails.jsx', name: 'BatchDetails' },
  
  // Teacher Attendance
  { path: 'src/pages/teacher/attendance/AttendanceDashboard.jsx', name: 'AttendanceDashboard' },
  { path: 'src/pages/teacher/attendance/AttendanceCalendar.jsx', name: 'AttendanceCalendar' },
  { path: 'src/pages/teacher/attendance/AttendanceForm.jsx', name: 'AttendanceForm' },
  { path: 'src/pages/teacher/attendance/AttendanceReport.jsx', name: 'AttendanceReport' },
  
  // Lab Teacher
  { path: 'src/pages/lab-teacher/Dashboard.jsx', name: 'LabTeacherDashboard' },
  
  // Components
  { path: 'src/components/SplashScreen.jsx', name: 'SplashScreen' },
  { path: 'src/components/OfflineIndicator.jsx', name: 'OfflineIndicator' },
];

// Check each component
let missingComponents = [];
let existingComponents = [];
let totalComponents = expectedComponents.length;

console.log('📋 Checking Components:\n');

expectedComponents.forEach(component => {
  const fullPath = path.join('frontend', component.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${component.name} - ${component.path}`);
    existingComponents.push(component);
  } else {
    console.log(`❌ ${component.name} - ${component.path} (MISSING)`);
    missingComponents.push(component);
  }
});

// Summary
console.log('\n📊 Summary:');
console.log(`✅ Existing Components: ${existingComponents.length}/${totalComponents}`);
console.log(`❌ Missing Components: ${missingComponents.length}/${totalComponents}`);

if (missingComponents.length > 0) {
  console.log('\n🚨 Missing Components:');
  missingComponents.forEach(component => {
    console.log(`   - ${component.name} (${component.path})`);
  });
  
  console.log('\n💡 Recommendations:');
  console.log('1. Create missing components or remove unused imports from App.jsx');
  console.log('2. Check for typos in import paths');
  console.log('3. Verify component export names match import names');
} else {
  console.log('\n🎉 All components found! Frontend structure is complete.');
}

// Check for unused imports (basic check)
console.log('\n🔍 Checking for potential issues...');

// Read App.jsx to check imports
try {
  const appJsxPath = path.join('frontend', 'src', 'App.jsx');
  if (fs.existsSync(appJsxPath)) {
    const appContent = fs.readFileSync(appJsxPath, 'utf8');
    
    // Check for unused imports (basic regex check)
    const importLines = appContent.split('\n').filter(line => line.trim().startsWith('import'));
    const componentUsage = appContent.split('\n').filter(line => 
      line.includes('<') && line.includes('element=')
    );
    
    console.log(`📄 App.jsx Analysis:`);
    console.log(`   - Import statements: ${importLines.length}`);
    console.log(`   - Component usages in routes: ${componentUsage.length}`);
    
    if (importLines.length > componentUsage.length + 10) {
      console.log('⚠️  Potential unused imports detected');
    }
  }
} catch (error) {
  console.log('⚠️  Could not analyze App.jsx:', error.message);
}

console.log('\n🔧 Next Steps:');
if (missingComponents.length > 0) {
  console.log('1. Create missing components using the component templates');
  console.log('2. Run: npm run dev to test the application');
  console.log('3. Fix any remaining import errors');
} else {
  console.log('1. Run: npm run dev to start the application');
  console.log('2. Test all routes and components');
  console.log('3. Check browser console for any runtime errors');
}
