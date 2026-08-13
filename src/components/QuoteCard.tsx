import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, Bookmark, Share2, MoreHorizontal, Copy, Flag, UserCircle2, Trash2, Check, X, Shield, Link as LinkIcon, Download } from 'lucide-react';
import { toggleLike, toggleSave, deleteQuote, adminDeleteQuote } from '../api';
import './QuoteCard.css';

const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

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
    username?: string;
    avatar?: string;
    initials?: string;
  };
  $extras?: {
    likes_count?: number;
    saves_count?: number;
    is_liked?: boolean;
    is_saved?: boolean;
  };
  categories?: { id: number; name: string }[];
  tags?: { id: number; name: string }[];
}

interface QuoteCardProps {
  quote: Quote;
  index: number;
  currentUserId?: number | null;
  currentUserRole?: string;
  onAuthRequired?: () => void;
  onDeleted?: (id: number) => void;
  onEdit?: (quote: Quote) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const STAGGER = 0.06;

export const QuoteCard = ({
  quote,
  index,
  currentUserId,
  currentUserRole,
  onAuthRequired,
  onDeleted,
  onEdit,
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

  // ── Share dropdown ────────────────────────────────────────────────────
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // ── Report state ──────────────────────────────────────────────────────
  const [isReported, setIsReported] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
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
  const quoteOwnerId = quote.userId ?? (quote as any).user_id;
  const isOwner = currentUserId != null && quoteOwnerId != null && currentUserId === quoteOwnerId;
  const isAdmin = currentUserRole === 'admin';

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

  const handleShareToX = () => {
    setShareMenuOpen(false);
    const shareText = `"${quote.content}"${authorName !== 'Unknown' ? ` — ${authorName}` : ''}`;
    const shareUrl = `${window.location.origin}/quotes/${quote.id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleCopyLink = () => {
    setShareMenuOpen(false);
    const shareUrl = `${window.location.origin}/quotes/${quote.id}`;
    copyToClipboard(shareUrl, 'Link copied to clipboard!');
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

  const handleDownloadImage = () => {
    setMenuOpen(false);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#16162a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f0ead6';
      ctx.font = 'italic 48px "DM Serif Display", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const words = quote.content.split(' ');
      let line = '';
      const lines = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 800 && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = 60;
      const startY = (canvas.height / 2) - 100 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, i) => {
        ctx.fillText(l, canvas.width / 2, startY + i * lineHeight);
      });

      ctx.font = '500 32px Inter, sans-serif';
      ctx.fillStyle = '#d4a853';
      ctx.fillText(`— ${authorName}`, canvas.width / 2, startY + lines.length * lineHeight + 60);

      const link = document.createElement('a');
      link.download = `quote-${quote.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
      onToast?.('Quote image downloaded!', 'success');
    } catch {
      onToast?.('Failed to generate image.', 'error');
    }
  };

  const handleReport = () => {
    setMenuOpen(false);
    if (isReported) {
      onToast?.('You have already reported this quote.', 'info');
      return;
    }
    setIsReported(true);
    onToast?.('Quote reported for review. Thank you for keeping the community safe.', 'success');
  };

  const handleViewAuthor = () => {
    setMenuOpen(false);
    const parts = [];
    if (authorName && authorName !== 'Unknown') parts.push(`Author: ${authorName}`);
    if (quote.source) parts.push(`Source: ${quote.source}`);
    if (postedBy && postedBy !== authorName) parts.push(`Posted by: ${postedBy}`);
    onToast?.(parts.length ? parts.join(' · ') : 'No author info available.', 'info');
  };

  const handleDelete = async (isAsAdmin = false) => {
    if (isAsAdmin) {
      const confirm = window.confirm('Are you sure you want to permanently delete this quote as an Admin?');
      if (!confirm) return;
    } else if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      if (isAsAdmin) {
        await adminDeleteQuote(quote.id);
      } else {
        await deleteQuote(quote.id);
      }
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
        <Link 
          to={quote.user?.username ? `/${quote.user.username}` : '#'} 
          className="quote-author-avatar"
          onClick={(e) => e.stopPropagation()}
        >
          {avatar
            ? <img src={avatar} alt={authorName} />
            : initials
          }
        </Link>
        <div className="quote-author-info">
          <Link 
            to={quote.user?.username ? `/${quote.user.username}` : '#'} 
            className="quote-author-name"
            onClick={(e) => e.stopPropagation()}
          >
            {authorName}
          </Link>
          {quote.source && (
            <span className="quote-author-source">{quote.source}</span>
          )}
          {postedBy && postedBy !== authorName && (
            <span className="quote-author-source">posted by {postedBy}</span>
          )}
        </div>
      </div>

      {/* Categories & Tags */}
      {(quote.categories?.length || quote.tags?.length) ? (
        <div className="quote-badges">
          {quote.categories?.map(c => (
            <span key={c.id} className="badge badge-category">{c.name}</span>
          ))}
          {quote.tags?.map(t => (
            <span key={t.id} className="badge badge-tag">#{t.name}</span>
          ))}
        </div>
      ) : null}

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
          <div className="card-menu-wrapper" ref={shareMenuRef}>
            <button
              className={`card-action-btn${shareMenuOpen ? ' active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShareMenuOpen(!shareMenuOpen); }}
              title="Share"
              aria-label="Share quote"
            >
              <Share2 />
            </button>
            {shareMenuOpen && (
              <div className="card-dropdown" role="menu" style={{ bottom: '100%', top: 'auto', marginBottom: '0.5rem' }}>
                <button className="dropdown-item" role="menuitem" onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
                  <LinkIcon size={14} />
                  Copy Link
                </button>
              </div>
            )}
          </div>

          {/* Share to X */}
          <button
            className="card-action-btn"
            onClick={(e) => { e.stopPropagation(); handleShareToX(); }}
            title="Share to X"
            aria-label="Share quote to X"
          >
            <XIcon size={16} />
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

              {/* Download Image */}
              <button className="dropdown-item" role="menuitem" onClick={handleDownloadImage}>
                <Download size={14} />
                Download Image
              </button>

              {/* View Author */}
              <button className="dropdown-item" role="menuitem" onClick={handleViewAuthor}>
                <UserCircle2 size={14} />
                View Author
              </button>

              {/* Report */}
              <button className="dropdown-item" role="menuitem" onClick={handleReport} disabled={isReported}>
                <Flag size={14} style={{ color: isReported ? 'var(--gold)' : 'inherit' }} />
                {isReported ? 'Reported' : 'Report'}
              </button>

              {/* Delete & Edit (owner only) */}
              {isOwner && (
                <>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); onEdit?.(quote); }}>
                    <MoreHorizontal size={14} style={{ opacity: 0 }} /> {/* spacer placeholder for icon alignment, or we can use PenLine from lucide but it's not imported here yet. Let's just use text or add PenLine later if needed. Actually we don't need the icon since it's just Edit. But I'll use MoreHorizontal with 0 opacity as a spacer just in case */}
                    Edit Quote
                  </button>
                  {confirmDelete ? (
                    <div className="dropdown-confirm">
                      <span>Delete this quote?</span>
                      <div className="dropdown-confirm-actions">
                        <button
                          className="dropdown-confirm-btn confirm"
                          onClick={() => handleDelete(false)}
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
                    <button className="dropdown-item danger" role="menuitem" onClick={() => handleDelete(false)}>
                      <Trash2 size={14} />
                      Delete Quote
                    </button>
                  )}
                </>
              )}

              {/* Admin Delete */}
              {isAdmin && !isOwner && (
                <>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" role="menuitem" onClick={() => handleDelete(true)}>
                    <Shield size={14} />
                    Delete (Admin)
                  </button>
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
