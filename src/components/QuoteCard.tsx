import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Bookmark, Share2, MoreHorizontal, Copy, Flag, UserCircle2, Trash2, Check, X } from 'lucide-react';
import { toggleLike, toggleSave, deleteQuote } from '../api';

export interface Quote {
  id: number;
  content: string;
  author: string;
  source?: string;
  createdAt: string;
  likes_count?: number;
  saves_count?: number;
  userId?: number;
  user?: {
    id: number;
    name: string;
    avatar?: string;
    initials?: string;
  };
  $extras?: {
    likes_count?: number;
    saves_count?: number;
    is_liked?: boolean;
    is_saved?: boolean;
  };
}

interface QuoteCardProps {
  quote: Quote;
  index: number;
  currentUserId?: number | null;
  onAuthRequired?: () => void;
  onDeleted?: (id: number) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const STAGGER = 0.06;

export const QuoteCard = ({
  quote,
  index,
  currentUserId,
  onAuthRequired,
  onDeleted,
  onToast,
}: QuoteCardProps) => {
  const style = { animationDelay: `${Math.min(index * STAGGER, 1.2)}s` };
  const navigate = useNavigate();
  const location = useLocation();

  // ── Like state (optimistic) ──────────────────────────────────────────
  const [liked, setLiked] = useState<boolean>(
    Boolean(quote.$extras?.is_liked)
  );
  const [likeCount, setLikeCount] = useState<number>(
    Number(quote.$extras?.likes_count ?? quote.likes_count ?? 0)
  );
  const [likeLoading, setLikeLoading] = useState(false);

  // ── Save state (optimistic) ──────────────────────────────────────────
  const [saved, setSaved] = useState<boolean>(
    Boolean(quote.$extras?.is_saved)
  );
  const [saveCount, setSaveCount] = useState<number>(
    Number(quote.$extras?.saves_count ?? quote.saves_count ?? 0)
  );
  const [saveLoading, setSaveLoading] = useState(false);

  // ── 3-dot dropdown ───────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Delete confirmation ───────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // ── Computed values ───────────────────────────────────────────────────
  const authorName = quote.author || quote.user?.name || 'Unknown';
  const postedBy = quote.user?.name;
  const avatar = quote.user?.avatar;
  const initials = (quote.user?.initials ?? authorName.slice(0, 2)).toUpperCase();
  const isLong = quote.content.length > 200;
  const isOwner = currentUserId != null && quote.userId != null && currentUserId === quote.userId;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (!currentUserId) { onAuthRequired?.(); return; }
    if (likeLoading) return;

    // Optimistic update
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
      // Revert on failure
      setLiked(prevLiked);
      setLikeCount(prevCount);
      onToast?.('Failed to update like. Try again.', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) { onAuthRequired?.(); return; }
    if (saveLoading) return;

    // Optimistic update
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
      // Revert on failure
      setSaved(prevSaved);
      setSaveCount(prevCount);
      onToast?.('Failed to update save. Try again.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `"${quote.content}"${authorName !== 'Unknown' ? ` — ${authorName}` : ''}`;
    const shareUrl = `${window.location.origin}${window.location.pathname}#quote-${quote.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Quoteshub', text: shareText, url: shareUrl });
      } catch (err: unknown) {
        const abortName = err && typeof err === 'object' && 'name' in err
          ? String((err as { name?: string }).name)
          : undefined;
        if (abortName !== 'AbortError') {
          // Fallback to clipboard if share fails
          await copyToClipboard(`${shareText}\n\n${shareUrl}`, 'Copied to clipboard!');
        }
      }
    } else {
      await copyToClipboard(`${shareText}\n\n${shareUrl}`, 'Copied to clipboard!');
    }
  };

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast?.(successMsg, 'success');
    } catch {
      onToast?.('Could not copy to clipboard.', 'error');
    }
  };

  const handleCopyQuote = async () => {
    setMenuOpen(false);
    await copyToClipboard(quote.content, 'Quote copied!');
  };

  const handleReport = () => {
    setMenuOpen(false);
    onToast?.('Thanks for the report. We will review it shortly.', 'info');
  };

  const handleViewAuthor = () => {
    setMenuOpen(false);
    const parts = [];
    if (authorName && authorName !== 'Unknown') parts.push(`Author: ${authorName}`);
    if (quote.source) parts.push(`Source: ${quote.source}`);
    if (postedBy && postedBy !== authorName) parts.push(`Posted by: ${postedBy}`);
    onToast?.(parts.length ? parts.join(' · ') : 'No author info available.', 'info');
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteQuote(quote.id);
      setMenuOpen(false);
      onDeleted?.(quote.id);
      onToast?.('Quote deleted.', 'success');
    } catch {
      onToast?.('Failed to delete quote. Try again.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.card-actions') || target.closest('.card-menu-wrapper') || target.closest('button')) {
      return;
    }
    if (window.innerWidth < 768) {
      navigate(`/quotes/${quote.id}`);
    } else {
      navigate(`/quotes/${quote.id}`, { state: { backgroundLocation: location } });
    }
  };

  return (
    <div className="quote-card" id={`quote-${quote.id}`} style={style} onClick={handleCardClick}>
      {/* Decorative large quote mark */}
      <div className="quote-mark" aria-hidden="true">"</div>

      {/* Quote body */}
      <p className={`quote-body${isLong ? ' long' : ''}`}>
        {quote.content}
      </p>

      {/* Author attribution */}
      <div className="quote-author-row">
        <div className="quote-author-avatar">
          {avatar
            ? <img src={avatar} alt={authorName} />
            : initials
          }
        </div>
        <div className="quote-author-info">
          <span className="quote-author-name">{authorName}</span>
          {quote.source && (
            <span className="quote-author-source">{quote.source}</span>
          )}
          {postedBy && postedBy !== authorName && (
            <span className="quote-author-source">posted by {postedBy}</span>
          )}
        </div>
      </div>

      {/* Footer: interactions */}
      <div className="card-footer">
        <div className="card-actions">
          {/* Like */}
          <button
            className={`card-action-btn${liked ? ' liked' : ''}`}
            onClick={handleLike}
            disabled={likeLoading}
            title={liked ? 'Unlike' : 'Like'}
            aria-label={liked ? 'Unlike quote' : 'Like quote'}
            aria-pressed={liked}
          >
            <Heart fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Save */}
          <button
            className={`card-action-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
            disabled={saveLoading}
            title={saved ? 'Unsave' : 'Save'}
            aria-label={saved ? 'Remove from saved' : 'Save quote'}
            aria-pressed={saved}
          >
            <Bookmark fill={saved ? 'currentColor' : 'none'} />
            {saveCount > 0 && <span>{saveCount}</span>}
          </button>

          {/* Share */}
          <button
            className="card-action-btn"
            onClick={handleShare}
            title="Share"
            aria-label="Share quote"
          >
            <Share2 />
          </button>
        </div>

        {/* 3-dot menu */}
        <div className="card-menu-wrapper" ref={menuRef}>
          <button
            className={`card-more-btn${menuOpen ? ' active' : ''}`}
            onClick={() => { setMenuOpen(!menuOpen); setConfirmDelete(false); }}
            title="More options"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="card-dropdown" role="menu">
              {/* Copy Quote */}
              <button className="dropdown-item" role="menuitem" onClick={handleCopyQuote}>
                <Copy size={14} />
                Copy Quote
              </button>

              {/* View Author */}
              <button className="dropdown-item" role="menuitem" onClick={handleViewAuthor}>
                <UserCircle2 size={14} />
                View Author
              </button>

              {/* Report */}
              <button className="dropdown-item" role="menuitem" onClick={handleReport}>
                <Flag size={14} />
                Report
              </button>

              {/* Delete (owner only) */}
              {isOwner && (
                <>
                  <div className="dropdown-divider" />
                  {confirmDelete ? (
                    <div className="dropdown-confirm">
                      <span>Delete this quote?</span>
                      <div className="dropdown-confirm-actions">
                        <button
                          className="dropdown-confirm-btn confirm"
                          onClick={handleDelete}
                          disabled={deleting}
                          aria-label="Confirm delete"
                        >
                          <Check size={13} />
                          {deleting ? 'Deleting...' : 'Yes, delete'}
                        </button>
                        <button
                          className="dropdown-confirm-btn cancel"
                          onClick={() => setConfirmDelete(false)}
                          aria-label="Cancel delete"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="dropdown-item danger" role="menuitem" onClick={handleDelete}>
                      <Trash2 size={14} />
                      Delete Quote
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Skeleton Loader ──────────────────────────────────────
const skHeights = [80, 60, 100, 70, 90];

export const QuoteCardSkeleton = ({ index = 0 }: { index?: number }) => (
  <div className="quote-card-skeleton" style={{ animationDelay: `${index * 0.05}s` }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        className="sk-line skeleton-shimmer"
        style={{ width: '100%', height: skHeights[index % skHeights.length] }}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.5rem' }}>
      <div className="sk-circle skeleton-shimmer" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div className="sk-line skeleton-shimmer" style={{ width: '40%' }} />
        <div className="sk-line skeleton-shimmer" style={{ width: '25%' }} />
      </div>
    </div>
    <div style={{
      display: 'flex', gap: '0.75rem', paddingTop: '0.875rem',
      borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '0.25rem',
    }}>
      <div className="sk-line skeleton-shimmer" style={{ width: 40 }} />
      <div className="sk-line skeleton-shimmer" style={{ width: 40 }} />
      <div className="sk-line skeleton-shimmer" style={{ width: 28 }} />
    </div>
  </div>
);
