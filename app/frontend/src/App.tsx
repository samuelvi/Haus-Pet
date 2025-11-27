import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { BreedList } from './components/BreedList';
import { BreedForm } from './components/BreedForm';
import { PetAdminList } from './components/PetAdminList';
import { PetAdminForm } from './components/PetAdminForm';
import { BreedTypeList } from './components/BreedTypeList';
import { PetGallery } from './components/PetGallery';
import { PetDetail } from './components/PetDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root to gallery */}
          <Route path="/" element={<Navigate to="/gallery" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/gallery" element={<PetGallery />} />
          <Route path="/pets/:id" element={<PetDetail />} />

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
            path="/admin/breeds"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <BreedList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/breeds/new"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <BreedForm />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/breeds/edit/:id"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <BreedForm />
              </RoleProtectedRoute>
            }
          />

          {/* Legacy routes - redirect to dashboard until breed management is implemented */}
          <Route path="/pets" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/pets"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <PetAdminList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/pets/new"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <PetAdminForm />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/pets/edit/:id"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <PetAdminForm />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/breed-types"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <BreedTypeList />
              </RoleProtectedRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
