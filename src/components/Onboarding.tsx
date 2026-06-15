import { useState, useEffect } from 'react';
import { submitOnboarding, fetchCategories } from '../api';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories().then(res => setCategories(res.data || res)).catch(console.error);
  }, []);

  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else {
      if (selectedCategories.length < 3) {
        setSelectedCategories([...selectedCategories, id]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await submitOnboarding({ username, bio });
      onComplete();
    } catch (err) {
      console.error('Onboarding failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <h2>Welcome to Quoteshub! 🎉</h2>
          <p>Let's personalize your experience. Tell us a bit about yourself.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="onboarding-body">
            <div className="form-group">
              <label className="form-label" htmlFor="ob-username">Choose a Username</label>
              <input
                id="ob-username"
                type="text"
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. quote_lover_99"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ob-bio">Short Bio (optional)</label>
              <textarea
                id="ob-bio"
                className="form-textarea"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Avid reader, thinker, and collector of words..."
                rows={2}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Pick up to 3 topics you love</label>
              <div className="onboarding-categories">
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`category-pill ${selectedCategories.includes(c.id) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="onboarding-footer">
            <button type="submit" className="btn-submit" disabled={submitting || !username}>
              {submitting ? 'Saving...' : 'Get Started'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
