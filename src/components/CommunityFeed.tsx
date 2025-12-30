import { useState, useEffect } from "react";
import { GrievanceCard } from "./GrievanceCard";
import { Filter, MapPin, Flame, Zap, RefreshCw, AlertTriangle, Users, ChevronDown } from "lucide-react";
import { apiClient } from "../services/api";

interface Grievance {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: "pending" | "in-progress" | "resolved";
  upvotes: number;
  timeAgo: string;
  image?: string;
  isUpvoted?: boolean;
  verifiedOnChain?: boolean;
  blockchainTxHash?: string | null;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  return then.toLocaleDateString();
}

function mapApiStatus(status: string): "pending" | "in-progress" | "resolved" {
  switch (status) {
    case "resolved": return "resolved";
    case "in_progress": return "in-progress";
    case "acknowledged": return "in-progress";
    case "escalated": return "in-progress";
    default: return "pending";
  }
}

export function CommunityFeed() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all") {
        params.status = filterStatus === "in-progress" ? "in_progress" : filterStatus;
      }
      if (filterCategory !== "all") {
        params.category = filterCategory;
      }

      const response = await apiClient.getCommunityFeed(params);
      const mapped = response.grievances.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category || "General",
        location: g.address || g.ward || "Location not specified",
        status: mapApiStatus(g.status),
        upvotes: g.upvotes || 0,
        timeAgo: formatTimeAgo(g.createdAt),
        image: g.image || g.files?.[0]?.filepath,
        verifiedOnChain: g.verifiedOnChain,
        blockchainTxHash: g.blockchainTxHash,
      }));
      setGrievances(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load community feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [filterStatus, filterCategory]);

  const handleUpvote = async (id: string) => {
    try {
      const result = await apiClient.upvoteGrievance(id);
      setUpvotedIds(prev => {
        const newSet = new Set(prev);
        if (result.upvoted) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
      setGrievances(prev => prev.map(g => {
        if (g.id === id) {
          return { ...g, upvotes: result.upvoted ? g.upvotes + 1 : g.upvotes - 1 };
        }
        return g;
      }));
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    padding: "10px 36px 10px 12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
    minWidth: "140px",
  };

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <AlertTriangle style={{ width: "48px", height: "48px", color: "#ef4444", marginBottom: "16px" }} />
        <p style={{ color: "#ef4444", fontWeight: 500, marginBottom: "16px" }}>{error}</p>
        <button
          onClick={fetchGrievances}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: "16px", height: "16px" }} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#f1f5f9",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users style={{ width: "24px", height: "24px", color: "#64748b" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>Community Feed</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>See what others are reporting in your area.</p>
          </div>
        </div>
        <button
          onClick={fetchGrievances}
          disabled={loading}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: "18px", height: "18px", color: "#6b7280", animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Location Banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: "#f3f4f6",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MapPin style={{ width: "22px", height: "22px", color: "#6b7280" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#111827", margin: 0 }}>Showing issues near you</p>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>Within 5 km radius</p>
        </div>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          Change
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Filter style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <ChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...selectStyle, paddingLeft: "36px" }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div style={{ position: "relative" }}>
          <ChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Categories</option>
            <option value="Roads & Infrastructure">Roads</option>
            <option value="Street Lights">Street Lights</option>
            <option value="Garbage Collection">Garbage</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Drainage & Sewage">Drainage</option>
            <option value="Parks & Gardens">Parks</option>
          </select>
        </div>
      </div>

      {/* Status Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            backgroundColor: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
          }}
        >
          <Flame style={{ width: "16px", height: "16px", color: "#64748b" }} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>{grievances.length} Active Issues</span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            backgroundColor: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
          }}
        >
          <Zap style={{ width: "16px", height: "16px", color: "#1e293b" }} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1e293b" }}>AI Prioritized</span>
        </div>
      </div>

      {/* Grievances List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#1e293b",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#6b7280", marginTop: "16px" }}>Loading community feed...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {grievances.map((grievance) => (
            <GrievanceCard
              key={grievance.id}
              {...grievance}
              isUpvoted={upvotedIds.has(grievance.id)}
              onUpvote={() => handleUpvote(grievance.id)}
            />
          ))}
        </div>
      )}

      {!loading && grievances.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>No grievances found matching your filters</p>
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterCategory("all");
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "14px",
              color: "#1e293b",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
