import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../security/src/contexts/AuthContext';
import { ProtectedRoute } from '../../security/src/components/ProtectedRoute';
import { Dashboard } from './components/Dashboard';
import { AnimalList } from './components/AnimalList';
import { AnimalForm } from './components/AnimalForm';

/**
 * Backend Management App
 * Handles breed management (protected routes)
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* All routes are protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pets/new"
            element={
              <ProtectedRoute>
                <PetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pets/edit/:id"
            element={
              <ProtectedRoute>
                <PetForm />
              </ProtectedRoute>
            }
          />

          {/* Animal routes for sponsorship management */}
          <Route
            path="/animals"
            element={
              <ProtectedRoute>
                <AnimalList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/animals/new"
            element={
              <ProtectedRoute>
                <AnimalForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/animals/edit/:id"
            element={
              <ProtectedRoute>
                <AnimalForm />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
