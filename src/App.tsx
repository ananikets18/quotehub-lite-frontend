import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { fetchQuotes, submitQuote, updateQuote, fetchCategories, fetchTags, fetchSavedQuotes, fetchLikedQuotes } from './api';
import { QuoteCard, QuoteCardSkeleton } from './components/QuoteCard';
import type { Quote as QuoteType } from './components/QuoteCard';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { Onboarding } from './components/Onboarding';
import { UserProfileDropdown } from './components/UserProfileDropdown';
import { Footer } from './components/Footer';
import { AuthModals } from './components/AuthModals';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PenLine, Search, AlertCircle, Feather, BookOpen } from 'lucide-react';
import './index.css';

// Lazy loaded components
const QuoteDetail = lazy(() => import('./components/QuoteDetail').then(m => ({ default: m.QuoteDetail })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const UserProfile = lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));
const ResetPassword = lazy(() => import('./components/ResetPassword').then(m => ({ default: m.ResetPassword })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.TermsPage })));
const DisclaimerPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.DisclaimerPage })));
const CookiePolicyPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.CookiePolicyPage })));
const FAQPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.FAQPage })));

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'trending' | 'saved' | 'liked'>('all');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [tags, setTags] = useState<{id: number, name: string}[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');

  // Cold Start State
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    const onWake = () => setIsWakingUp(true);
    const onResolved = () => setIsWakingUp(false);
    window.addEventListener('cold-start-warning', onWake);
    window.addEventListener('cold-start-resolved', onResolved);
    return () => {
      window.removeEventListener('cold-start-warning', onWake);
      window.removeEventListener('cold-start-resolved', onResolved);
    };
  }, []);

  // Navbar scroll shadow
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth state from Context
  const { currentUser, setCurrentUser, setShowAuthModal, logout: handleLogout } = useAuth();

  // Global toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Quote submit/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteType | null>(null);
  const [newQuoteContent, setNewQuoteContent] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');
  const [newQuoteCategories, setNewQuoteCategories] = useState<number[]>([]);
  const [newQuoteTags, setNewQuoteTags] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Search & Debounce
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()]);
        setCategories(Array.isArray(cats) ? cats : (Array.isArray(cats.data) ? cats.data : (cats.categories || cats.data?.data || [])));
        setTags(Array.isArray(tgs) ? tgs : (Array.isArray(tgs.data) ? tgs.data : (tgs.tags || tgs.data?.data || [])));
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    };
    loadFilters();
  }, []);

  // Load initial quotes (or when filters change)
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        setError(null);
        let response;
        if (activeFilter === 'saved') {
          response = await fetchSavedQuotes(1);
        } else if (activeFilter === 'liked') {
          response = await fetchLikedQuotes(1);
        } else {
          response = await fetchQuotes({
            page: 1,
            search: debouncedSearch || undefined,
            category: selectedCategoryFilter ? Number(selectedCategoryFilter) : undefined,
            tag: selectedTagFilter ? Number(selectedTagFilter) : undefined,
          });
        }
        
        const data = Array.isArray(response)
          ? response
          : (Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []));
        
        // Client-side sorting for recent/trending as a fallback if not handled by backend
        let sorted = [...data];
        if (activeFilter === 'recent') {
          sorted.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
        } else if (activeFilter === 'trending') {
          const getLikes = (q: QuoteType) => Number(q.$extras?.likes_count ?? q.likes_count ?? 0);
          sorted.sort((a, b) => getLikes(b) - getLikes(a));
        }

        setQuotes(sorted);
        setPage(1);
        setHasMore(data.length >= 10); // Assume page size is at least 10
      } catch (err) {
        console.error('Failed to fetch quotes:', err);
        setError('Failed to load quotes. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    loadQuotes();
  }, [activeFilter, debouncedSearch, selectedCategoryFilter, selectedTagFilter]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      let response;
      if (activeFilter === 'saved') {
        response = await fetchSavedQuotes(nextPage);
      } else if (activeFilter === 'liked') {
        response = await fetchLikedQuotes(nextPage);
      } else {
        response = await fetchQuotes({
          page: nextPage,
          search: debouncedSearch || undefined,
          category: selectedCategoryFilter ? Number(selectedCategoryFilter) : undefined,
          tag: selectedTagFilter ? Number(selectedTagFilter) : undefined,
        });
      }
      
      const data = Array.isArray(response)
        ? response
        : (Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []));
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setQuotes(prev => {
          const newQuotes = data.filter((q: QuoteType) => !prev.some(p => p.id === q.id));
          return [...prev, ...newQuotes];
        });
        setPage(nextPage);
        if (data.length < 10) setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more quotes:', err);
      showToast('Failed to load more quotes', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const displayedQuotes = quotes;

  // Submit quote (Create or Edit)
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
      const payload = {
        content: newQuoteContent,
        author: newQuoteAuthor || undefined,
        source: newQuoteSource || undefined,
        categories: newQuoteCategories,
        tags: newQuoteTags,
      };

      if (editingQuote) {
        const updatedQuote = await updateQuote(editingQuote.id, payload);
        setQuotes(prev => prev.map(q => q.id === editingQuote.id ? { ...q, ...updatedQuote } : q));
        showToast('Your quote has been updated!');
      } else {
        const newQuote = await submitQuote(payload);
        setQuotes(prev => [newQuote, ...prev]);
        showToast('Your quote has been shared!');
      }

      setShowModal(false);
      setEditingQuote(null);
      setNewQuoteContent('');
      setNewQuoteAuthor('');
      setNewQuoteSource('');
      setNewQuoteCategories([]);
      setNewQuoteTags([]);
    } catch (err: unknown) {
      console.error('Failed to submit quote:', err);
      const msg = getErrorMessage(err, 'Failed to save quote. Please try again.');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Auth is now handled in AuthModals and AuthContext

  // Remove deleted quote from feed
  const handleQuoteDeleted = (id: number) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const closeOnOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  return (
    <>
      {/* ───── Cold Start Banner ───── */}
      {isWakingUp && (
        <div className="cold-start-banner" role="alert">
          <Feather className="spin" size={16} />
          Waking up the server... Please allow up to 50 seconds on the free tier.
        </div>
      )}

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
                <NotificationsDropdown />
                <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
                <button
                  className="nav-btn-primary"
                  onClick={() => {
                    setEditingQuote(null);
                    setNewQuoteContent('');
                    setNewQuoteAuthor('');
                    setNewQuoteSource('');
                    setNewQuoteCategories([]);
                    setNewQuoteTags([]);
                    setShowModal(true);
                  }}
                  id="submit-quote-btn"
                >
                  <PenLine size={14} />
                  Share
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
      <ErrorBoundary>
        <Suspense fallback={<div className="loading-fallback">Loading...</div>}>
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
                    <button className="btn-hero-primary" onClick={() => {
                      setEditingQuote(null);
                      setNewQuoteContent('');
                      setNewQuoteAuthor('');
                      setNewQuoteSource('');
                      setNewQuoteCategories([]);
                      setNewQuoteTags([]);
                      setShowModal(true);
                    }}>
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
                  <AlertCircle size={16} className="alert-icon" />
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
                        : activeFilter === 'saved' ? 'Saved Quotes'
                          : activeFilter === 'liked' ? 'Liked Quotes'
                            : 'Trending Now'}
                </h2>
                {!searchQuery && (
                  <div className="filters-row">
                    <div className="filter-tabs" role="tablist">
                      {(['all', 'recent', 'trending', ...(currentUser ? ['saved', 'liked'] : [])] as const).map(f => (
                        <button
                          key={f}
                          role="tab"
                          aria-selected={activeFilter === f}
                          className={`filter-tab${activeFilter === f ? ' active' : ''}`}
                          onClick={() => setActiveFilter(f as 'all' | 'recent' | 'trending' | 'saved' | 'liked')}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                    {/* Category and Tag Selects */}
                    {activeFilter !== 'saved' && activeFilter !== 'liked' && (
                      <div className="header-filters">
                        <select
                          className="header-select"
                          value={selectedCategoryFilter}
                          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                          aria-label="Filter by category"
                        >
                          <option value="">All Categories</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <select
                          className="header-select"
                          value={selectedTagFilter}
                          onChange={(e) => setSelectedTagFilter(e.target.value)}
                          aria-label="Filter by tag"
                        >
                          <option value="">All Tags</option>
                          {tags.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
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
                    <p className="empty-state-text">
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
                      onEdit={(quote) => {
                        setEditingQuote(quote);
                        setNewQuoteContent(quote.content);
                        setNewQuoteAuthor(quote.author || '');
                        setNewQuoteSource(quote.source || '');
                        setNewQuoteCategories(quote.categories?.map(c => c.id) || []);
                        setNewQuoteTags(quote.tags?.map(t => t.id) || []);
                        setShowModal(true);
                      }}
                      onToast={showToast}
                    />
                  ))
                )}
              </div>

              {/* Load More Button */}
              {!loading && displayedQuotes.length > 0 && hasMore && !searchQuery && (
                <div className="load-more-container">
                  <button
                    className="nav-btn-outline btn-load-more"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
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
            <Route path="/analytics" element={
              <ProtectedRoute>
                <main>
                  <div className="container">
                    <AnalyticsDashboard currentUserId={currentUser?.id ?? null} />
                  </div>
                </main>
              </ProtectedRoute>
            } />
            <Route path="/users/:id" element={
              <main>
                <div className="container">
                  <UserProfile currentUserId={currentUser?.id ?? null} />
                </div>
              </main>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <main>
                  <div className="container">
                    <SettingsPage />
                  </div>
                </main>
              </ProtectedRoute>
            } />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/reset-password" element={
              <main>
                <div className="container">
                  <ResetPassword />
                </div>
              </main>
            } />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <main>
                  <AdminDashboard currentUser={currentUser as any} />
                </main>
              </ProtectedRoute>
            } />
            <Route path="/u/:username" element={
              <main>
                <div className="container">
                  <UserProfile currentUserId={currentUser?.id ?? null} />
                </div>
              </main>
            } />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <Footer />

      {backgroundLocation && (
        <ErrorBoundary>
          <Suspense fallback={null}>
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
          </Suspense>
        </ErrorBoundary>
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

      {/* ───── Submit/Edit Quote Modal ───── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeOnOverlayClick} role="dialog" aria-modal="true" aria-label={editingQuote ? "Edit quote" : "Submit a quote"}>
          <div className="modal wide">
            <div className="modal-header">
              <h2 className="modal-title">{editingQuote ? 'Edit Quote' : 'Share a Quote'}</h2>
              <p className="modal-subtitle">
                {editingQuote ? 'Update your quote details below.' : 'Add words that moved you to the collection.'}
              </p>
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
                <div className="form-group form-group-mb0">
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
                <div className="form-row">
                  <div className="form-group form-group-mb0">
                    <label className="form-label" htmlFor="quote-categories">Categories (Select multiple)</label>
                    <select
                      id="quote-categories"
                      multiple
                      className="form-select"
                      value={newQuoteCategories.map(String)}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                        setNewQuoteCategories(options);
                      }}
                      size={4}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group form-group-mb0">
                    <label className="form-label" htmlFor="quote-tags">Tags (Select multiple)</label>
                    <select
                      id="quote-tags"
                      multiple
                      className="form-select"
                      value={newQuoteTags.map(String)}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                        setNewQuoteTags(options);
                      }}
                      size={4}
                    >
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
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
                  {submitting ? (editingQuote ? 'Updating…' : 'Publishing…') : (editingQuote ? 'Save Changes' : 'Publish Quote')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Onboarding Modal ───── */}
      {currentUser && currentUser.isOnboarded === false && (
        <Onboarding onComplete={() => {
          const updatedUser = { ...currentUser, isOnboarded: true };
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }} />
      )}

      {/* ───── Auth Modal ───── */}
      <AuthModals onToast={showToast} />
    </>
  );
}

export default App;
