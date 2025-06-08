import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home/Index";
import Login from "./pages/Login/Index";
import RegisterUser from "./pages/RegisterUser/Index";
import RegisterClient from "./pages/RegisterClient/Index";
import Error from "./pages/Error/Index";
import ProtectedRoute from "./components/ProtectedRoute/Index";
import "./utils/styles/global.scss";

// Lazy load components that aren't needed on initial load
const Dashboard = lazy(() => import("./pages/Dashboard/Index"));
const ProspectEditPage = lazy(() => import("./components/Dashboard/Prospects/prospectEditPage"));

// Loading fallback
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner">⏳</div>
    <p className="loading-text">Chargement en cours...</p>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <div className="align-page">
        <Routes>
          {/* Page d'accueil */}
          <Route path="/" element={<Home />} />
          
          {/* Routes publiques */}
          <Route path="/register-user" element={<RegisterUser />} />
          <Route path="/register-client/:userId" element={<RegisterClient />} />
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées avec lazy loading */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          
          {/* Route de modification des prospects avec lazy loading */}
          <Route
            path="/prospect/edit/:id"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <ProspectEditPage />
                </Suspense>
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