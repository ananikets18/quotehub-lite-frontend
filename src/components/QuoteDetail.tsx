import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuote, toggleLike, toggleSave } from '../api';
import type { Quote } from './QuoteCard';
import { Heart, Bookmark, X, AlertCircle, Share2, ArrowLeft, Link as LinkIcon } from 'lucide-react';

const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface QuoteDetailProps {
  isModal?: boolean;
  currentUserId?: number | null;
  onAuthRequired?: () => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export function QuoteDetail({ isModal, currentUserId, onAuthRequired, onToast }: QuoteDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistic states
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  // Share dropdown state
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareMenuOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchQuote(Number(id));
        const q = data.data || data; // depending on backend format
        setQuote(q);
        setLiked(Boolean(q.$extras?.is_liked));
        setLikeCount(Number(q.$extras?.likes_count ?? q.likes_count ?? 0));
        setSaved(Boolean(q.$extras?.is_saved));
        setSaveCount(Number(q.$extras?.saves_count ?? q.saves_count ?? 0));
      } catch (err) {
        setError('Failed to load quote.');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleClose = () => {
    if (isModal) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const closeOnOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleLike = async () => {
    if (!currentUserId) { onAuthRequired?.(); return; }
    if (likeLoading || !quote) return;
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? Math.max(0, likeCount - 1) : likeCount + 1);
    setLikeLoading(true);
    try {
      const result = await toggleLike(quote.id);
      setLiked(result.liked);
      setLikeCount(result.count);
      onToast?.(result.liked ? 'Quote liked!' : 'Like removed', 'success');
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      onToast?.('Failed to update like. Try again.', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) { onAuthRequired?.(); return; }
    if (saveLoading || !quote) return;
    const prevSaved = saved;
    const prevCount = saveCount;
    setSaved(!saved);
    setSaveCount(saved ? Math.max(0, saveCount - 1) : saveCount + 1);
    setSaveLoading(true);
    try {
      const result = await toggleSave(quote.id);
      setSaved(result.saved);
      setSaveCount(result.count);
      onToast?.(result.saved ? 'Saved to your collection!' : 'Removed from collection', 'success');
    } catch {
      setSaved(prevSaved);
      setSaveCount(prevCount);
      onToast?.('Failed to update save. Try again.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShareToX = () => {
    if (!quote) return;
    setShareMenuOpen(false);
    const authorName = quote.author || quote.user?.name || 'Unknown';
    const shareText = `"${quote.content}"${authorName !== 'Unknown' ? ` — ${authorName}` : ''}`;
    const shareUrl = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleCopyLink = () => {
    setShareMenuOpen(false);
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      onToast?.('Link copied to clipboard!', 'success');
    }).catch(() => {
      onToast?.('Could not copy to clipboard.', 'error');
    });
  };

  const content = (
    <div className={`quote-detail-content ${isModal ? 'is-modal' : 'is-standalone'}`}>
      {loading ? (
        <div className="quote-detail-loading">Loading...</div>
      ) : error ? (
        <div className="quote-detail-error">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      ) : quote ? (
        <>
          <div className="quote-detail-body">
             <div className="quote-mark large">"</div>
             <h2>{quote.content}</h2>
          </div>
          <div className="quote-detail-meta">
            <div className="author-info">
              <span className="author-name">{quote.author || quote.user?.name || 'Unknown'}</span>
              {quote.source && <span className="author-source">{quote.source}</span>}
            </div>
            {(quote.categories?.length || quote.tags?.length) ? (
              <div className="quote-badges" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                {quote.categories?.map(c => (
                  <span key={c.id} className="badge badge-category">{c.name}</span>
                ))}
                {quote.tags?.map(t => (
                  <span key={t.id} className="badge badge-tag">#{t.name}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="quote-detail-actions">
            <button className={`detail-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              <Heart fill={liked ? 'currentColor' : 'none'} size={20} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button className={`detail-action-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
              <Bookmark fill={saved ? 'currentColor' : 'none'} size={20} />
              {saveCount > 0 && <span>{saveCount}</span>}
            </button>
            <div className="card-menu-wrapper" ref={shareMenuRef} style={{ display: 'inline-block' }}>
              <button 
                className={`detail-action-btn ${shareMenuOpen ? 'active' : ''}`} 
                onClick={(e) => { e.stopPropagation(); setShareMenuOpen(!shareMenuOpen); }}
              >
                <Share2 size={20} />
              </button>
              {shareMenuOpen && (
                <div className="card-dropdown" role="menu" style={{ bottom: '100%', top: 'auto', marginBottom: '0.5rem', right: 0 }}>
                  <button className="dropdown-item" role="menuitem" onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
                    <LinkIcon size={14} />
                    Copy Link
                  </button>
                  <button className="dropdown-item" role="menuitem" onClick={(e) => { e.stopPropagation(); handleShareToX(); }}>
                    <XIcon size={14} />
                    Share to X
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );

  if (isModal) {
    return (
      <div className="modal-overlay quote-modal-overlay" onClick={closeOnOverlayClick}>
        <div className="modal quote-modal">
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="container standalone-quote-page">
      <button className="back-btn" onClick={handleClose}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="modal quote-modal" style={{ margin: '0 auto' }}>
        {content}
      </div>
    </div>
  );
}
