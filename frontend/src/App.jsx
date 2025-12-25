import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Course from './pages/Course.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
        {/* 
        <Route path="/courses/:id/room" element={<ProtectedRoute><CourseRoom /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectSpace /></ProtectedRoute>} />
        <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
        <Route path="/tournaments/:id" element={<ProtectedRoute><Tournament /></ProtectedRoute>} />
        */}
      </Routes>
    </div>
  )
}

export default App
