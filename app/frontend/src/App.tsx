import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
// import { PetList } from './components/PetList'; // TODO: Create BreedList component
// import { PetForm } from './components/PetForm'; // TODO: Create BreedForm component
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
          {/* TODO: Re-enable these routes once BreedList and BreedForm components are created
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
          */}

          {/* Legacy routes - redirect to dashboard until breed management is implemented */}
          <Route path="/pets" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/pets" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/breeds" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
