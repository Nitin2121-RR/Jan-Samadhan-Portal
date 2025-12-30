import { useState, useEffect } from "react";
import { GrievanceCard } from "./GrievanceCard";
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, FileText } from "lucide-react";
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
  eta?: string;
  assignedTo?: string;
  resolvedDate?: string;
  resolvedBy?: string;
  image?: string;
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

function formatResolvedDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return `Resolved on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function MyGrievances() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getMyGrievances();
      const mapped = response.grievances.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category || "General",
        location: g.address || g.ward || "Location not specified",
        status: mapApiStatus(g.status),
        upvotes: g.upvotes || 0,
        timeAgo: formatTimeAgo(g.createdAt),
        eta: g.status === "in_progress" ? "In progress" : g.status === "pending" ? "Under review" : undefined,
        assignedTo: g.assignedTo?.name ? `${g.assignedTo.name}` : undefined,
        resolvedDate: g.resolvedAt ? formatResolvedDate(g.resolvedAt) : undefined,
        resolvedBy: g.assignedTo?.name,
        image: g.files?.[0]?.filepath,
        verifiedOnChain: g.verifiedOnChain,
        blockchainTxHash: g.blockchainTxHash,
      }));
      setGrievances(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load grievances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const activeCount = grievances.filter(g => g.status !== "resolved").length;
  const resolvedCount = grievances.filter(g => g.status === "resolved").length;

  const filteredGrievances = grievances.filter(g => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return g.status !== "resolved";
    if (activeTab === "resolved") return g.status === "resolved";
    return true;
  });

  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "active" as const, label: "Active" },
    { id: "resolved" as const, label: "Resolved" },
  ];

  const stats = [
    { label: "Active", value: activeCount, icon: Clock, color: "#64748b", bg: "#f1f5f9" },
    { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Total", value: grievances.length, icon: FileText, color: "#6b7280", bg: "#f3f4f6" },
  ];

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
            <FileText style={{ width: "24px", height: "24px", color: "#64748b" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>My Grievances</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>Track the status of your reported issues.</p>
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 4px 0" }}>{stat.label}</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{stat.value}</p>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: stat.bg,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon style={{ width: "22px", height: "22px", color: stat.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "12px",
          padding: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "4px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px",
              backgroundColor: activeTab === tab.id ? "#ffffff" : "transparent",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: activeTab === tab.id ? "#111827" : "#6b7280",
              cursor: "pointer",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
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
          <p style={{ color: "#6b7280", marginTop: "16px" }}>Loading your grievances...</p>
        </div>
      ) : filteredGrievances.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "48px",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280", margin: 0 }}>
            {activeTab === "all" && "You haven't filed any grievances yet."}
            {activeTab === "active" && "No active grievances."}
            {activeTab === "resolved" && "No resolved grievances yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredGrievances.map((grievance) => (
            <div key={grievance.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <GrievanceCard {...grievance} />

              {/* Progress card for in-progress */}
              {grievance.status === "in-progress" && (
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#1e293b" }}>Progress</span>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{grievance.eta}</span>
                  </div>
                  <div style={{ height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "60%", backgroundColor: "#1e293b", borderRadius: "4px" }} />
                  </div>
                  {grievance.assignedTo && (
                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                      Assigned to: {grievance.assignedTo}
                    </p>
                  )}
                </div>
              )}

              {/* Waiting card for pending */}
              {grievance.status === "pending" && (
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Waiting for assignment • {grievance.eta}
                  </p>
                </div>
              )}

              {/* Resolved card */}
              {grievance.status === "resolved" && grievance.resolvedDate && (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    border: "1px solid #86efac",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#16a34a", margin: 0 }}>
                    {grievance.resolvedDate}{grievance.resolvedBy ? ` • By ${grievance.resolvedBy}` : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
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
