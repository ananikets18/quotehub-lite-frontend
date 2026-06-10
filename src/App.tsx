import { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { fetchQuotes, submitQuote, login, signup, logout } from './api';
import { QuoteCard, QuoteCardSkeleton } from './components/QuoteCard';
import type { Quote as QuoteType } from './components/QuoteCard';
import { QuoteDetail } from './components/QuoteDetail';
import { PenLine, Search, LogOut, AlertCircle, Feather, BookOpen } from 'lucide-react';
import './index.css';

type CurrentUser = {
  id: number;
  name: string;
  email?: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object') {
    const maybe = err as { response?: { data?: { errors?: { message?: string }[] } } };
    const apiMessage = maybe.response?.data?.errors?.[0]?.message;
    if (apiMessage) return apiMessage;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

function App() {
  const location = useLocation();
  const backgroundLocation = location.state && location.state.backgroundLocation;
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'trending'>('all');

  // Navbar scroll shadow
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (saved === 'undefined' || token === 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', passwordConfirmation: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Global toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Quote submit modal
  const [showModal, setShowModal] = useState(false);
  const [newQuoteContent, setNewQuoteContent] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Load quotes
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchQuotes(1);
        const data = Array.isArray(response)
          ? response
          : response.data || response.data?.data || [];
        setQuotes(data);
      } catch (err) {
        console.error('Failed to fetch quotes:', err);
        setError('Failed to load quotes. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    loadQuotes();
  }, []);

  // Filtered + searched quotes
  const filteredQuotes = quotes.filter(q => {
    if (!searchQuery.trim()) return true;
    const q_ = searchQuery.toLowerCase();
    return (
      q.content?.toLowerCase().includes(q_) ||
      q.author?.toLowerCase().includes(q_) ||
      q.source?.toLowerCase().includes(q_)
    );
  });

  const displayedQuotes = (() => {
    if (activeFilter === 'all') return filteredQuotes;
    const sorted = [...filteredQuotes];
    if (activeFilter === 'recent') {
      sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      return sorted;
    }
    const getLikes = (q: QuoteType) => Number(q.$extras?.likes_count ?? q.likes_count ?? 0);
    sorted.sort((a, b) => getLikes(b) - getLikes(a));
    return sorted;
  })();

  // Submit quote
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowModal(false);
      setShowAuthModal('login');
      return;
    }
    if (!newQuoteContent.trim()) return;
    try {
      setSubmitting(true);
      const newQuote = await submitQuote({
        content: newQuoteContent,
        author: newQuoteAuthor || undefined,
        source: newQuoteSource || undefined,
      });
      setQuotes(prev => [newQuote, ...prev]);
      setShowModal(false);
      setNewQuoteContent('');
      setNewQuoteAuthor('');
      setNewQuoteSource('');
      showToast('Your quote has been shared!');
    } catch (err: unknown) {
      console.error('Failed to submit quote:', err);
      const msg = getErrorMessage(err, 'Failed to submit quote. Please try again.');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (showAuthModal === 'login') {
        const data = await login({ email: authForm.email, password: authForm.password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setShowAuthModal(null);
        showToast(`Welcome back, ${data.user.name}!`);
      } else {
        if (authForm.password !== authForm.passwordConfirmation) {
          throw new Error('Passwords do not match');
        }
        const data = await signup(authForm);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setShowAuthModal(null);
        showToast(`Welcome to Quoteshub, ${data.user.name}!`);
      }
      setAuthForm({ fullName: '', email: '', password: '', passwordConfirmation: '' });
    } catch (err: unknown) {
      setAuthError(getErrorMessage(err, 'Authentication failed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); }
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      showToast('Logged out. See you soon!');
    }
  };

  // Remove deleted quote from feed
  const handleQuoteDeleted = (id: number) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const closeOnOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
      setShowAuthModal(null);
      setAuthError('');
    }
  };

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* ───── Navbar ───── */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo */}
          <a href="/" className="logo">Quoteshub</a>

          {/* Search */}
          <div className="navbar-search">
            <Search className="navbar-search-icon" />
            <input
              type="search"
              placeholder="Search quotes, authors…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search quotes"
            />
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {currentUser ? (
              <>
                <div className="user-chip">
                  <div className="user-chip-avatar">{userInitials}</div>
                  {currentUser.name.split(' ')[0]}
                </div>
                <button
                  className="nav-btn-primary"
                  onClick={() => setShowModal(true)}
                  id="submit-quote-btn"
                >
                  <PenLine size={14} />
                  Share
                </button>
                <button
                  className="nav-btn-outline"
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <>
                <button className="nav-btn-ghost" onClick={() => setShowAuthModal('login')}>
                  Log In
                </button>
                <button className="nav-btn-primary" onClick={() => setShowAuthModal('signup')}>
                  Join Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ───── Routing & Main ───── */}
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={
          <main>
            <div className="container">

              {/* Hero */}
              <section className="hero">
                <div className="hero-eyebrow">
                  <Feather size={11} />
                  For writers, readers &amp; thinkers
                </div>
                <h1 className="hero-title">
                  A Haven for{' '}
                  <span className="gradient-text">Words &amp; Wisdom</span>
                </h1>
                <p className="hero-sub">
                  Discover quotes that move you, share words that define you,
                  and build a collection of the phrases that shape your world.
                </p>
                <div className="hero-cta-row">
                  {currentUser ? (
                    <button className="btn-hero-primary" onClick={() => setShowModal(true)}>
                      <PenLine size={16} />
                      Share a Quote
                    </button>
                  ) : (
                    <>
                      <button className="btn-hero-primary" onClick={() => setShowAuthModal('signup')}>
                        <Feather size={16} />
                        Start Your Collection
                      </button>
                      <button className="btn-hero-secondary" onClick={() => setShowAuthModal('login')}>
                        Already a member?
                      </button>
                    </>
                  )}
                </div>
                <div className="hero-stats">
                  <div className="stat-item">
                    <span className="stat-number">
                      {loading ? '…' : quotes.length.toLocaleString()}+
                    </span>
                    <span className="stat-label">Quotes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">∞</span>
                    <span className="stat-label">Inspiration</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      <BookOpen size={20} />
                    </span>
                    <span className="stat-label">Curated Daily</span>
                  </div>
                </div>
              </section>

              {/* Error Banner */}
              {error && (
                <div className="error-banner" role="alert">
                  <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  {error}
                </div>
              )}

              {/* Section Header + Filters */}
              <div className="section-header">
                <h2 className="section-title">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : activeFilter === 'all' ? 'All Quotes'
                      : activeFilter === 'recent' ? 'Recently Added'
                        : 'Trending Now'}
                </h2>
                {!searchQuery && (
                  <div className="filter-tabs" role="tablist">
                    {(['all', 'recent', 'trending'] as const).map(f => (
                      <button
                        key={f}
                        role="tab"
                        aria-selected={activeFilter === f}
                        className={`filter-tab${activeFilter === f ? ' active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Masonry Grid */}
              <div className="masonry-grid" role="feed" aria-label="Quotes feed">
                {loading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <QuoteCardSkeleton key={i} index={i} />
                  ))
                ) : displayedQuotes.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">"</span>
                    <h3>No quotes found</h3>
                    <p style={{ fontSize: '0.875rem' }}>
                      {searchQuery ? 'Try a different search term.' : 'Be the first to share a quote!'}
                    </p>
                  </div>
                ) : (
                  displayedQuotes.map((quote, index) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      index={index}
                      currentUserId={currentUser?.id ?? null}
                      onAuthRequired={() => setShowAuthModal('login')}
                      onDeleted={handleQuoteDeleted}
                      onToast={showToast}
                    />
                  ))
                )}
              </div>
            </div>
          </main>
        } />
        <Route path="/quotes/:id" element={
          <QuoteDetail
            isModal={false}
            currentUserId={currentUser?.id}
            onAuthRequired={() => setShowAuthModal('login')}
            onToast={showToast}
          />
        } />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="/quotes/:id" element={
            <QuoteDetail
              isModal={true}
              currentUserId={currentUser?.id}
              onAuthRequired={() => setShowAuthModal('login')}
              onToast={showToast}
            />
          } />
        </Routes>
      )}

      {/* ───── Footer ───── */}
      <footer className="site-footer">
        <div className="container">
          Made with <span>♥</span> for words that matter · Quoteshub © {new Date().getFullYear()}
        </div>
      </footer>

      {/* ───── Toast ───── */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
          <div className="toast-icon">
            {toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2715' : 'i'}
          </div>
          {toast.msg}
        </div>
      )}

      {/* ───── Submit Quote Modal ───── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeOnOverlayClick} role="dialog" aria-modal="true" aria-label="Submit a quote">
          <div className="modal wide">
            <div className="modal-header">
              <h2 className="modal-title">Share a Quote</h2>
              <p className="modal-subtitle">Add words that moved you to the collection.</p>
            </div>
            <form onSubmit={handleSubmitQuote}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="quote-content">Quote *</label>
                  <textarea
                    id="quote-content"
                    required
                    className="form-textarea"
                    rows={5}
                    value={newQuoteContent}
                    onChange={e => setNewQuoteContent(e.target.value)}
                    placeholder="The words that resonated with you…"
                    maxLength={2000}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="quote-author">Author</label>
                  <input
                    id="quote-author"
                    type="text"
                    className="form-input"
                    value={newQuoteAuthor}
                    onChange={e => setNewQuoteAuthor(e.target.value)}
                    placeholder="Who said this? (optional)"
                    maxLength={255}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="quote-source">Source</label>
                  <input
                    id="quote-source"
                    type="text"
                    className="form-input"
                    value={newQuoteSource}
                    onChange={e => setNewQuoteSource(e.target.value)}
                    placeholder="Book, speech, interview… (optional)"
                    maxLength={255}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || !newQuoteContent.trim()}
                  id="confirm-submit-quote"
                >
                  {submitting ? 'Publishing…' : 'Publish Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Auth Modal ───── */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={closeOnOverlayClick} role="dialog" aria-modal="true" aria-label="Authentication">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {showAuthModal === 'login' ? 'Welcome Back' : 'Join Quoteshub'}
              </h2>
              <p className="modal-subtitle">
                {showAuthModal === 'login'
                  ? 'Sign in to save, share and curate quotes.'
                  : 'Create your free account in seconds.'}
              </p>
            </div>
            <form onSubmit={handleAuth}>
              <div className="modal-body">
                {authError && (
                  <div className="form-alert error" role="alert">
                    <AlertCircle size={15} />
                    {authError}
                  </div>
                )}

                {showAuthModal === 'signup' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-name">Full Name *</label>
                    <input
                      id="auth-name"
                      required
                      type="text"
                      className="form-input"
                      value={authForm.fullName}
                      onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                      placeholder="Your full name"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-email">Email *</label>
                  <input
                    id="auth-email"
                    required
                    type="email"
                    className="form-input"
                    value={authForm.email}
                    onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                    placeholder="you@example.com"
                    autoComplete={showAuthModal === 'login' ? 'email' : 'username'}
                    autoFocus={showAuthModal === 'login'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-password">Password *</label>
                  <input
                    id="auth-password"
                    required
                    type="password"
                    className="form-input"
                    value={authForm.password}
                    onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    autoComplete={showAuthModal === 'login' ? 'current-password' : 'new-password'}
                    minLength={8}
                  />
                </div>

                {showAuthModal === 'signup' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="auth-confirm-password">Confirm Password *</label>
                    <input
                      id="auth-confirm-password"
                      required
                      type="password"
                      className="form-input"
                      value={authForm.passwordConfirmation}
                      onChange={e => setAuthForm({ ...authForm, passwordConfirmation: e.target.value })}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn-cancel" onClick={() => { setShowAuthModal(null); setAuthError(''); }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={authLoading}
                    id={showAuthModal === 'login' ? 'btn-login' : 'btn-signup'}
                  >
                    {authLoading
                      ? 'Please wait…'
                      : showAuthModal === 'login' ? 'Sign In' : 'Create Account'
                    }
                  </button>
                </div>
                <div className="auth-switch">
                  {showAuthModal === 'login' ? (
                    <>Don't have an account?{' '}
                      <button type="button" onClick={() => { setShowAuthModal('signup'); setAuthError(''); }}>
                        Sign up free
                      </button>
                    </>
                  ) : (
                    <>Already a member?{' '}
                      <button type="button" onClick={() => { setShowAuthModal('login'); setAuthError(''); }}>
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
