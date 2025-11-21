import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { PetList } from './components/PetList';
import { PetForm } from './components/PetForm';
import { AnimalGallery } from './components/AnimalGallery';
import { AnimalDetail } from './components/AnimalDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root to gallery */}
          <Route path="/" element={<Navigate to="/gallery" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/gallery" element={<AnimalGallery />} />
          <Route path="/animals/:id" element={<AnimalDetail />} />

          {/* Admin routes - protected by ADMIN role */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Dashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/pets"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <PetList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/pets/new"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <PetForm />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/pets/edit/:id"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <PetForm />
              </RoleProtectedRoute>
            }
          />

          {/* Legacy public route - redirect to admin */}
          <Route path="/pets" element={<Navigate to="/admin/pets" replace />} />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
