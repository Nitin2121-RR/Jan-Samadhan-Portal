import { useState, useEffect } from "react";
import { Plus, TrendingUp, Users, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { apiClient } from "../services/api";

interface HomeScreenProps {
  onFileGrievance: () => void;
}

interface StatsData {
  activeIssues: number;
  resolved: number;
  citizens: string;
  avgResponse: string;
  loading: boolean;
}

export function HomeScreen({ onFileGrievance }: HomeScreenProps) {
  const [statsData, setStatsData] = useState<StatsData>({
    activeIssues: 0,
    resolved: 0,
    citizens: "0",
    avgResponse: "-",
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.getCommunityFeed({ limit: 1 });
        const total = response.pagination?.total || 0;

        const resolvedResponse = await apiClient.getCommunityFeed({ status: "resolved", limit: 1 });
        const resolvedCount = resolvedResponse.pagination?.total || 0;

        setStatsData({
          activeIssues: total - resolvedCount,
          resolved: resolvedCount,
          citizens: total > 1000 ? `${Math.floor(total / 1000)}K+` : total.toString(),
          avgResponse: "2.5d",
          loading: false
        });
      } catch {
        setStatsData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return num.toLocaleString();
  };

  const stats = [
    { label: "Active Issues", value: formatNumber(statsData.activeIssues), icon: AlertCircle, color: "#64748b", bg: "#f1f5f9" },
    { label: "Resolved", value: formatNumber(statsData.resolved), icon: CheckCircle2, color: "#166534", bg: "#f0fdf4" },
    { label: "Total Filed", value: statsData.citizens, icon: Users, color: "#64748b", bg: "#f1f5f9" },
    { label: "Avg. Response", value: statsData.avgResponse, icon: TrendingUp, color: "#64748b", bg: "#f1f5f9" },
  ];

  const steps = [
    { number: 1, title: "Describe Your Issue", description: "Share details in your own words or use voice input", color: "#1e293b", bg: "#f1f5f9" },
    { number: 2, title: "AI Processes", description: "System categorizes, routes, and prioritizes", color: "#1e293b", bg: "#f1f5f9" },
    { number: 3, title: "Track & Updates", description: "Real-time notifications on progress", color: "#1e293b", bg: "#f1f5f9" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Welcome Hero */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Sparkles style={{ width: "20px", height: "20px", color: "#64748b" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI-Powered</span>
            </div>
            <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#111827", margin: "0 0 12px 0", lineHeight: 1.2 }}>
              Jan-Samadhan Portal
            </h1>
            <p style={{ fontSize: "15px", color: "#6b7280", margin: 0, maxWidth: "500px", lineHeight: 1.6 }}>
              Your voice matters. File grievances, track resolutions, and make your community better.
            </p>
          </div>
          <button
            onClick={onFileGrievance}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 24px",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(30,41,59,0.2)",
              alignSelf: "flex-start",
            }}
          >
            <Plus style={{ width: "20px", height: "20px" }} />
            File a Grievance
            <ArrowRight style={{ width: "18px", height: "18px" }} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
        }}
      >
        {statsData.loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "12px",
                height: "100px",
                animation: "pulse 2s infinite",
              }}
            />
          ))
        ) : (
          stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>{stat.label}</p>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: stat.bg,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon style={{ width: "18px", height: "18px", color: stat.color }} />
                  </div>
                </div>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{stat.value}</p>
              </div>
            );
          })
        )}
      </div>

      {/* How It Works */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "28px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "0 0 24px 0" }}>How It Works</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: step.bg,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "16px", fontWeight: 700, color: step.color }}>{step.number}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>{step.title}</p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
            cursor: "pointer",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#f1f5f9",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Users style={{ width: "24px", height: "24px", color: "#64748b" }} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>Community Feed</p>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>View local issues</p>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
            cursor: "pointer",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#f1f5f9",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 style={{ width: "24px", height: "24px", color: "#64748b" }} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>Track Grievances</p>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Check your status</p>
        </div>
      </div>

      {/* Pulse animation for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
