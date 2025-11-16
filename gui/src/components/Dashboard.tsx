import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Dashboard Component (Wireframe Style)
 * Empty dashboard showing user info and logout
 */
export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>HausPet Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome!</h2>
          <div style={styles.userInfo}>
            <p style={styles.infoRow}>
              <strong>Name:</strong> {user?.name}
            </p>
            <p style={styles.infoRow}>
              <strong>Email:</strong> {user?.email}
            </p>
            <p style={styles.infoRow}>
              <strong>Role:</strong> {user?.role}
            </p>
            <p style={styles.infoRow}>
              <strong>Status:</strong>{' '}
              <span style={user?.isActive ? styles.statusActive : styles.statusInactive}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>

        <div style={styles.placeholder}>
          <div style={styles.placeholderContent}>
            <h3 style={styles.placeholderTitle}>Quick Actions</h3>
            <p style={styles.placeholderText}>
              Manage pet breeds database
            </p>
            <button
              onClick={() => navigate('/pets')}
              style={styles.petManagementButton}
            >
              Go to Pet Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wireframe styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    backgroundColor: '#fff',
    borderBottom: '2px solid #ddd',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#d32f2f',
    backgroundColor: '#fff',
    border: '2px solid #d32f2f',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  content: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  card: {
    padding: '30px',
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    borderRadius: '8px',
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  statusActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  statusInactive: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  placeholder: {
    padding: '60px',
    backgroundColor: '#fff',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    textAlign: 'center',
  },
  placeholderContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  placeholderTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#999',
  },
  placeholderText: {
    margin: 0,
    fontSize: '14px',
    color: '#999',
  },
  wireframeBoxes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    width: '100%',
    marginTop: '20px',
  },
  wireframeBox: {
    height: '150px',
    backgroundColor: '#fafafa',
    border: '2px dashed #ccc',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wireframeLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  petManagementButton: {
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '10px',
  },
};
