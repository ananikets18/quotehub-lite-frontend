import { useState, useRef, useEffect } from 'react';
import { LogOut, User, BarChart2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserProfileDropdown.css';

interface UserProfileDropdownProps {
  user: { name: string; email?: string; role?: string; username?: string };
  onLogout: () => void;
}

export function UserProfileDropdown({ user, onLogout }: UserProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button className="user-chip-btn" onClick={() => setOpen(!open)} aria-haspopup="true" aria-expanded={open}>
        <div className="user-chip-avatar">{initials}</div>
        <span>{user.name.split(' ')[0]}</span>
      </button>

      {open && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <strong>{user.name}</strong>
            {user.email && <span>{user.email}</span>}
          </div>
          <div className="profile-dropdown-list">
            <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/settings'); }}>
              <User size={16} />
              My Profile
            </button>
            <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/analytics'); }}>
              <BarChart2 size={16} />
              Analytics Dashboard
            </button>
            {user.role === 'admin' && (
              <button className="dropdown-item" style={{ color: 'var(--brand-primary)' }} onClick={() => { setOpen(false); navigate('/admin'); }}>
                <Shield size={16} />
                Admin Dashboard
              </button>
            )}
            <div className="dropdown-divider"></div>
            <button className="dropdown-item danger" onClick={() => { setOpen(false); onLogout(); }}>
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
