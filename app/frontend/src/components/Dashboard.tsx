import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { SystemCounters } from '../types/api.types';
import { CountersService } from '../services/counters.service';
import { AdminNav } from './AdminNav';

export const Dashboard: React.FC = () => {
  const { user, tokens, sessionId, logout } = useAuth();
  const navigate = useNavigate();
  const [counters, setCounters] = useState<SystemCounters | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounters = async () => {
      if (!tokens || !sessionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await CountersService.getCounters(
          tokens.accessToken,
          sessionId
        );
        setCounters(data);
      } catch (error) {
        console.error('Error fetching counters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounters();
  }, [tokens, sessionId]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  const quickActions = [
    {
      title: 'Manage Breeds',
      description: 'CRUD operations for breed management',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'from-secondary-400 to-secondary-600',
      route: '/admin/breeds',
    },
    {
      title: 'Manage Pets',
      description: 'Event-sourced pet management',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-accent-400 to-accent-600',
      route: '/admin/pets',
    },
    {
      title: 'Breed Types',
      description: 'Manage pet breed categories',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'from-warm-500 to-warm-700',
      route: '/admin/breed-types',
    },
  ];

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-primary-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        {/* Welcome Card */}
        <div className="card shadow-soft mb-8">
          <div className="card-body">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-gray-600 text-base">
                  Manage your pet shelter efficiently from this dashboard
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {user?.isActive ? (
                  <span className="badge badge-success">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Active
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">Email</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">Role</p>
                <p className="font-semibold text-gray-900">{user?.role}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">User ID</p>
                <p className="font-semibold text-gray-900 text-xs truncate">{user?.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.route)}
                className="group card hover:shadow-medium transition-all duration-200 text-left"
              >
                <div className="card-body">
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                    {action.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                    Open
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="card shadow-soft">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">System Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-semibold mb-1">Total Breeds</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {loading ? '-' : counters?.totalBreeds ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-semibold mb-1">Active Pets</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {loading ? '-' : counters?.totalActivePets ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-semibold mb-1">Breed Types</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {loading ? '-' : counters?.totalBreedTypes ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 6v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 font-semibold mb-1">Sponsorships</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">
                      {loading ? '-' : counters?.totalSponsorships ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
};
