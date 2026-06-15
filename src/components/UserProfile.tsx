import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUserProfile, fetchUserQuotes } from '../api';
import { QuoteCard } from './QuoteCard';
import type { Quote } from './QuoteCard';
import './UserProfile.css';

interface UserProfileData {
  id: number;
  name: string;
  username: string;
  bio: string;
  createdAt: string;
  totalQuotes: number;
}

interface UserProfileProps {
  currentUserId?: number | null;
}

export function UserProfile({ currentUserId }: UserProfileProps = {}) {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPage(1);
    
    Promise.all([
      fetchUserProfile(Number(id)),
      fetchUserQuotes(Number(id), 1)
    ])
      .then(([profileRes, quotesRes]) => {
        setProfile(profileRes);
        setQuotes(quotesRes.data);
        setHasMore(quotesRes.meta.currentPage < quotesRes.meta.lastPage);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const loadMore = async () => {
    if (!id || !hasMore) return;
    try {
      const nextPage = page + 1;
      const res = await fetchUserQuotes(Number(id), nextPage);
      setQuotes(prev => [...prev, ...res.data]);
      setPage(nextPage);
      setHasMore(res.meta.currentPage < res.meta.lastPage);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && !profile) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-error">User not found.</div>;
  }

  const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-info">
          <h1>{profile.name}</h1>
          {profile.username && <span className="profile-username">@{profile.username}</span>}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <div className="stat">
              <strong>{profile.totalQuotes}</strong> Quotes
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <h2>Quotes by {profile.name.split(' ')[0]}</h2>
        {quotes.length > 0 ? (
          <div className="masonry-grid">
            {quotes.map((quote, index) => (
              <QuoteCard 
                key={quote.id} 
                quote={quote} 
                index={index} 
                currentUserId={currentUserId}
                onDeleted={(id) => setQuotes(prev => prev.filter(q => q.id !== id))}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>This user hasn't posted any quotes yet.</p>
          </div>
        )}

        {hasMore && (
          <div className="load-more-container">
            <button className="btn-secondary" onClick={loadMore}>
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
