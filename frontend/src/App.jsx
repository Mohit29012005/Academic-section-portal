import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminCourses from './pages/admin/Courses';
import AdminTimetable from './pages/admin/Timetable';
import AcademicCycle from './pages/admin/AcademicCycle';
import Notifications from './pages/admin/Notifications';
import AdminPYQs from './pages/admin/PYQs';

import Academics from './pages/Academics';
import About from './pages/About';

import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentTimetable from './pages/student/Timetable';
import StudentResults from './pages/student/Results';
import StudentProfile from './pages/student/Profile';
import StudentPYQs from './pages/student/PYQs';
import CareerGuidance from './pages/student/Career_Guidance';
import AIAttendancePage from './pages/student/AIAttendancePage';
import AttendanceCamera from './pages/student/AttendanceCamera';
import QRAttendance from './pages/student/QRAttendance';

import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyPYQs from './pages/faculty/PYQs';
import FacultyTimetable from './pages/faculty/Timetable';
import FacultyProfile from './pages/faculty/Profile';
import FacultySchedule from './pages/faculty/Schedule';
import AIAttendanceHub from './pages/faculty/AIAttendanceHub';
import FacultyGrading from './pages/faculty/Grading';

import StudentFaceStatus from './pages/admin/StudentFaceStatus';

// ─── Route guard: blocks student pages if not authenticated or face not registered ──
function StudentRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user?.role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/about" element={<About />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/faculty" element={<AdminFaculty />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/timetable" element={<AdminTimetable />} />
          <Route path="/admin/academic-cycle" element={<AcademicCycle />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/pyqs" element={<AdminPYQs />} />
          <Route path="/admin/student-face-status" element={<StudentFaceStatus />} />

          {/* AI Attendance */}
          <Route path="/student/attendance-setup" element={<StudentRoute><AIAttendancePage /></StudentRoute>} />
          <Route path="/student/attendance-camera" element={<StudentRoute><AttendanceCamera /></StudentRoute>} />
          <Route path="/student/mark-attendance/:qr_token" element={<QRAttendance />} />

          {/* Student Routes — guarded */}
          <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
          <Route path="/student/attendance" element={<StudentRoute><StudentAttendance /></StudentRoute>} />
          <Route path="/student/timetable" element={<StudentRoute><StudentTimetable /></StudentRoute>} />
          <Route path="/student/results" element={<StudentRoute><StudentResults /></StudentRoute>} />
          <Route path="/student/pyqs" element={<StudentRoute><StudentPYQs /></StudentRoute>} />
          <Route path="/student/profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />
          <Route path="/student/career-guidance" element={<StudentRoute><CareerGuidance /></StudentRoute>} />

          {/* Faculty Routes */}
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty/attendance" element={<AIAttendanceHub />} />
          <Route path="/faculty/ai-attendance" element={<AIAttendanceHub />} />
          <Route path="/faculty/pyqs" element={<FacultyPYQs />} />
          <Route path="/faculty/timetable" element={<FacultyTimetable />} />
          <Route path="/faculty/schedule" element={<FacultySchedule />} />
          <Route path="/faculty/grading" element={<FacultyGrading />} />
          <Route path="/faculty/profile" element={<FacultyProfile />} />

          {/* 404 Fallback */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a href="/" className="text-blue-600 hover:text-blue-800 underline">
                  Go back home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
