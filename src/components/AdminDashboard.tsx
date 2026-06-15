import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Trash2, Users } from 'lucide-react';
import { getAdminUsers, adminDeleteUser, type User } from '../api';

interface AdminDashboardProps {
  currentUser: User | null;
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If not logged in or not an admin, boot them out
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Are you sure you have admin privileges?');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete user ${email} and all their quotes? This cannot be undone.`);
    if (!confirm) return;

    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0', minHeight: '80vh' }}>
      <div className="flex items-center gap-3 mb-8" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Shield size={32} color="var(--brand-primary)" />
        <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Admin Dashboard</h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="var(--text-secondary)" />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Manage Users</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ID</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name / Username</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Quotes</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s ease' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.id}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                      <div>{user.fullName}</div>
                      {user.username && <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>@{user.username}</div>}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.875rem',
                        backgroundColor: user.role === 'admin' ? 'rgba(255, 69, 58, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        color: user.role === 'admin' ? '#ff453a' : 'var(--text-secondary)'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {(user as any).totalQuotes || 0}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff453a',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginLeft: 'auto',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
