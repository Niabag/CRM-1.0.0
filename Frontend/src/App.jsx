import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/index.jsx';
import Home from './pages/Home/Index.jsx';
import Login from './pages/Login/Index.jsx';
import RegisterUser from './pages/RegisterUser/Index.jsx';
import RegisterClient from './pages/RegisterClient/Index.jsx';
import Dashboard from './pages/Dashboard/Index.jsx';
import Error from './pages/Error/Index.jsx';
import ProtectedRoute from './components/ProtectedRoute/Index.jsx';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/register-client/:cardId" element={<RegisterClient />} />
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
}

export default App;