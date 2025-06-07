import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login/Index";
import RegisterUser from "./pages/RegisterUser/Index";
import RegisterClient from "./pages/RegisterClient/Index";
import Dashboard from "./pages/Dashboard/Index";
import Error from "./pages/Error/Index";
import ProtectedRoute from "./components/ProtectedRoute/Index";
import "./utils/styles/global.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <div className="align-page">
        <Routes>
          {/* Redirection de la racine vers le dashboard si connecté, sinon vers login */}
          <Route 
            path="/" 
            element={
              localStorage.getItem("token") ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Routes publiques */}
          <Route path="/register-user" element={<RegisterUser />} />
          <Route path="/register-client/:userId" element={<RegisterClient />} />
          <Route path="/login" element={<Login />} />
          
          {/* Route protégée */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Gestion des erreurs */}
          <Route path="/404" element={<Error />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);