import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Course from './pages/Course.jsx';
import Quiz from "./pages/Quiz.jsx";
import Test from './pages/Test.jsx';
import ComingSoon from "./pages/ComingSoon.jsx";

function App() {

  return (
    <div>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/courses/:courseId" element={<ProtectedRoute><Course /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
        <Route path={`/courses/:courseId/quiz`} element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        {/* <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} /> */}
        <Route path="/tournaments" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
        <Route path="/coming-soon" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
