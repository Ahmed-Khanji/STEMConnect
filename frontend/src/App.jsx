import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Home from './pages/home/Home.jsx';
import Auth from './pages/home/Auth.jsx';
import Course from './pages/course/Course.jsx';
import Quiz from "./pages/course/Quiz.jsx";
import Test from './pages/other/Test.jsx';
import ComingSoon from "./pages/other/ComingSoon.jsx";
import Projects from "./pages/project/Projects.jsx";
import ProjectShowcase from "./pages/project/ProjectShowcase.jsx";

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
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectShowcase />} />
        <Route path="/tournaments" element={<ComingSoon />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
      </Routes>
    </div>
  )
}

export default App
