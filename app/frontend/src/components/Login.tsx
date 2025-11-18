import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Login Component (Wireframe Style)
 * Minimalistic login form for authentication
 */
export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>HausPet Admin</h1>
        <p style={styles.subtitle}>Login to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@hauspet.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={styles.hintText}>Default credentials:</p>
          <p style={styles.hintText}>Email: admin@hauspet.com</p>
          <p style={styles.hintText}>Password: Admin123</p>
        </div>
      </div>
    </div>
  );
};

// Wireframe styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  box: {
    width: '400px',
    padding: '40px',
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    borderRadius: '8px',
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    margin: '0 0 30px 0',
    fontSize: '14px',
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  error: {
    margin: '0',
    padding: '12px',
    fontSize: '14px',
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    border: '1px solid #d32f2f',
    borderRadius: '4px',
  },
  hint: {
    marginTop: '30px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    border: '1px dashed #ddd',
    borderRadius: '4px',
  },
  hintText: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#666',
  },
};
