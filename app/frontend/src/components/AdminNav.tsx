import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AdminNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Logo/Brand */}
        <Link to="/admin/dashboard" style={styles.brand}>
          <span style={styles.logo}>🐾</span>
          <span style={styles.brandText}>HausPet Admin</span>
        </Link>

        {/* Navigation Links */}
        <div style={styles.links}>
          <Link
            to="/admin/dashboard"
            style={{
              ...styles.link,
              ...(isActive('/admin/dashboard') ? styles.linkActive : {}),
            }}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/breeds"
            style={{
              ...styles.link,
              ...(isActive('/admin/breeds') || location.pathname.startsWith('/admin/breeds/')
                ? styles.linkActive
                : {}),
            }}
          >
            Breeds
          </Link>
          <Link
            to="/admin/breed-types"
            style={{
              ...styles.link,
              ...(isActive('/admin/breed-types') ? styles.linkActive : {}),
            }}
          >
            Breed Types
          </Link>
          <Link
            to="/admin/pets"
            style={{
              ...styles.link,
              ...(isActive('/admin/pets') || location.pathname.startsWith('/admin/pets/')
                ? styles.linkActive
                : {}),
            }}
          >
            Pets
          </Link>
        </div>

        {/* User Actions */}
        <div style={styles.actions}>
          <Link to="/gallery" style={styles.viewSiteLink}>
            View Site
          </Link>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    backgroundColor: '#fff',
    borderBottom: '2px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: 700,
    fontSize: '18px',
  },
  logo: {
    fontSize: '24px',
  },
  brandText: {
    color: '#333',
  },
  links: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    padding: '8px 16px',
    textDecoration: 'none',
    color: '#666',
    fontWeight: 500,
    fontSize: '14px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  linkActive: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  viewSiteLink: {
    padding: '8px 16px',
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 500,
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #007bff',
    transition: 'all 0.2s',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
