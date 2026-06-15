import { useState, useEffect } from 'react';
import { BarChart2, Heart, Bookmark, Eye, Activity } from 'lucide-react';
import { fetchAnalytics } from '../api';
import { QuoteCard } from './QuoteCard';
import type { Quote } from './QuoteCard';
import './AnalyticsDashboard.css';

interface AnalyticsData {
  totalQuotes: number;
  totalLikes: number;
  totalSaves: number;
  totalViews: number;
  totalImpressions: number;
  engagementRate: number;
  topQuote: Quote | null;
}

interface AnalyticsDashboardProps {
  currentUserId?: number | null;
  onDeleted?: (id: number) => void;
}

export function AnalyticsDashboard({ currentUserId, onDeleted }: AnalyticsDashboardProps = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="analytics-error">Could not load analytics.</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2><BarChart2 size={24} /> Your Impact Dashboard</h2>
        <p>See how your words are resonating with the community.</p>
      </div>

      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-icon"><Activity size={20} /></div>
          <div className="stat-card-value">{data.totalQuotes}</div>
          <div className="stat-card-label">Quotes Shared</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: '#ef4444' }}><Heart size={20} /></div>
          <div className="stat-card-value">{data.totalLikes}</div>
          <div className="stat-card-label">Total Likes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: '#6366f1' }}><Bookmark size={20} /></div>
          <div className="stat-card-value">{data.totalSaves}</div>
          <div className="stat-card-label">Total Saves</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: '#10b981' }}><Eye size={20} /></div>
          <div className="stat-card-value">{data.totalViews}</div>
          <div className="stat-card-label">Detail Views</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: '#f59e0b' }}><BarChart2 size={20} /></div>
          <div className="stat-card-value">{data.totalImpressions}</div>
          <div className="stat-card-label">Feed Impressions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: '#8b5cf6' }}><Activity size={20} /></div>
          <div className="stat-card-value">{(data.engagementRate * 100).toFixed(1)}%</div>
          <div className="stat-card-label">Engagement Rate</div>
        </div>
      </div>

      {data.topQuote && (
        <div className="top-quote-section">
          <h3>Your Top Performing Quote</h3>
          <div className="top-quote-wrapper">
            <QuoteCard 
              quote={data.topQuote} 
              index={0} 
              currentUserId={currentUserId}
              onDeleted={(id) => {
                setData({ ...data, topQuote: null });
                onDeleted?.(id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
