import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuote, toggleLike, toggleSave } from '../api';
import type { Quote } from './QuoteCard';
import { Heart, Bookmark, X, AlertCircle, Share2, ArrowLeft } from 'lucide-react';

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

  const handleShare = async () => {
    if (!quote) return;
    const authorName = quote.author || quote.user?.name || 'Unknown';
    const shareText = `"${quote.content}"${authorName !== 'Unknown' ? ` — ${authorName}` : ''}`;
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quoteshub', text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        onToast?.('Copied to clipboard!', 'success');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        onToast?.('Copied to clipboard!', 'success');
      }
    }
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
            <button className="detail-action-btn" onClick={handleShare}>
              <Share2 size={20} />
            </button>
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
