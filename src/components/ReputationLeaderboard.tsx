import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react';
import { ReputationBadge } from './ReputationBadge';

interface LeaderboardEntry {
  id: string;
  name: string;
  department: string;
  position?: string;
  grievancesAssigned: number;
  grievancesResolved: number;
  resolutionRate: number;
  score: number;
  onChainScore?: number;
}

interface ReputationLeaderboardProps {
  limit?: number;
}

export const ReputationLeaderboard: React.FC<ReputationLeaderboardProps> = ({
  limit = 10,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/reputation/leaderboard?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-saffron" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-warning" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-saffron/10 border-saffron/20';
      case 2:
        return 'bg-secondary/60 border-border';
      case 3:
        return 'bg-warning/10 border-warning/20';
      default:
        return 'bg-card border-border';
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-saffron" />
          <h3 className="font-semibold text-foreground">Authority Leaderboard</h3>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Leaderboard entries */}
      <div className="divide-y divide-border">
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const displayScore = entry.onChainScore || entry.score;

          return (
            <div
              key={entry.id}
              className={`px-4 py-3 flex items-center gap-4 ${getRankBg(rank)} border-l-4 transition-colors hover:bg-secondary/60`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 flex justify-center">
                {getRankIcon(rank)}
              </div>

              {/* Authority info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {entry.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {entry.department}
                  {entry.position && ` - ${entry.position}`}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="hidden sm:block text-center">
                  <p className="font-medium text-foreground">
                    {entry.resolutionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
                <div className="hidden md:block text-center">
                  <p className="font-medium text-foreground">
                    {entry.grievancesResolved}/{entry.grievancesAssigned}
                  </p>
                  <p className="text-xs text-muted-foreground">Cases</p>
                </div>
                <ReputationBadge score={displayScore} size="sm" showLabel={false} />
              </div>

              {/* On-chain indicator */}
              {entry.onChainScore && (
                <div className="flex-shrink-0" title="Verified on blockchain">
                  <ExternalLink className="w-4 h-4 text-success" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No authorities found
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-secondary/40 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing top {leaderboard.length} authorities
        </span>
        <div className="flex items-center gap-1 text-success">
          <TrendingUp className="w-4 h-4" />
          <span>On-chain verified</span>
        </div>
      </div>
    </div>
  );
};

export default ReputationLeaderboard;
