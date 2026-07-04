import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, deleteAccount, fetchAccountProfile } from '../api';
import { User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.css';

export function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { currentUser, setCurrentUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    username: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!currentUser) {
          navigate('/');
          return;
        }
        
        const data = await fetchAccountProfile();
        
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          username: data.username || ''
        });
      } catch (err) {
        setError('Failed to load your profile settings.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateProfile({ name: formData.name, bio: formData.bio });
      setSuccess('Profile updated successfully!');
      
      // Update AuthContext state
      if (currentUser) {
        const updatedUser = { ...currentUser, name: formData.name };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you absolutely sure you want to delete your account? This will permanently delete your profile, quotes, and all associated data. This action cannot be undone.');
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
    } catch (err) {
      setError('Failed to delete account. Please try again later.');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <User size={32} />
        <h1>Account Settings</h1>
      </div>

      <div className="settings-card">
        <h2>Profile Information</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={formData.username} 
              disabled 
              className="disabled-input"
              title="Usernames cannot be changed"
            />
            <small>Your public URL is: /{formData.username}</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Display Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              required
              minLength={2}
              maxLength={50}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea 
              id="bio" 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange}
              maxLength={200}
              rows={4}
              placeholder="Tell the community a little about yourself..."
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="settings-card danger-zone">
        <h2><AlertTriangle size={20} /> Danger Zone</h2>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button 
          className="btn-danger" 
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? 'Deleting Account...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
}
