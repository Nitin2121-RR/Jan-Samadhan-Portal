import { MapPin, Clock, AlertTriangle, Users, TrendingUp, CheckCircle2, ExternalLink, CheckCircle, Play, Check, Calendar } from "lucide-react";

interface PriorityBreakdown {
  totalScore: number;
  severityScore: number;
  upvoteScore: number;
  timeScore: number;
  categoryScore: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}

interface PriorityGrievanceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  ward: string;
  status: "pending" | "acknowledged" | "in-progress" | "resolved";
  priorityScore: number;
  severity: number;
  duplicates: number;
  upvotes: number;
  timeElapsed: string;
  submittedBy: string;
  image?: string;
  isEscalated?: boolean;
  verifiedOnChain?: boolean;
  blockchainTxHash?: string | null;
  contractAddress?: string | null;
  priorityBreakdown?: PriorityBreakdown;
  expectedResolutionDays?: number;
  estimatedResolutionDate?: string;
  onAcknowledge?: () => void;
  onStartProgress?: () => void;
  onResolve?: () => void;
  onClick?: () => void;
}

export function PriorityGrievanceCard({
  id: _id,
  title,
  description,
  category,
  location,
  ward,
  status,
  priorityScore,
  severity,
  upvotes,
  timeElapsed,
  submittedBy,
  image,
  isEscalated,
  verifiedOnChain,
  blockchainTxHash,
  priorityBreakdown,
  expectedResolutionDays,
  estimatedResolutionDate,
  onAcknowledge,
  onStartProgress,
  onResolve,
  onClick
}: PriorityGrievanceCardProps) {
  // Calculate if ETA is overdue
  const isOverdue = estimatedResolutionDate && new Date(estimatedResolutionDate) < new Date() && status !== "resolved";
  const daysRemaining = estimatedResolutionDate
    ? Math.ceil((new Date(estimatedResolutionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const urgencyColors = {
    critical: { bg: "#991b1b", label: "CRITICAL" },
    high: { bg: "#78716c", label: "HIGH" },
    medium: { bg: "#64748b", label: "MEDIUM" },
    low: { bg: "#166534", label: "LOW" },
  };

  const statusConfig = {
    pending: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0", label: "Pending" },
    acknowledged: { bg: "#f1f5f9", color: "#1e293b", border: "#cbd5e1", label: "Acknowledged" },
    "in-progress": { bg: "#f1f5f9", color: "#1e293b", border: "#cbd5e1", label: "In Progress" },
    resolved: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", label: "Resolved" }
  };

  const getPriorityStyle = (score: number): React.CSSProperties => {
    if (score >= 80) return { backgroundColor: "#fef2f2", color: "#991b1b" };
    if (score >= 60) return { backgroundColor: "#f1f5f9", color: "#78716c" };
    if (score >= 40) return { backgroundColor: "#f1f5f9", color: "#64748b" };
    return { backgroundColor: "#f1f5f9", color: "#1e293b" };
  };

  const config = statusConfig[status];

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: isEscalated ? "2px solid #dc2626" : "1px solid #e5e7eb",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Escalated Banner */}
      {isEscalated && (
        <div style={{ backgroundColor: "#dc2626", color: "#ffffff", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <AlertTriangle style={{ width: "16px", height: "16px" }} />
          <span style={{ fontWeight: 500 }}>Escalated - ETA Missed</span>
        </div>
      )}

      <div style={{ padding: "24px" }}>
        {/* Header Row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          {/* Priority Score Box */}
          <div style={{
            ...getPriorityStyle(priorityScore),
            width: "64px",
            height: "64px",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
          }}>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>{priorityScore}</div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Score</div>
            {priorityBreakdown?.urgencyLevel && (
              <div style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                padding: "2px 8px",
                fontSize: "10px",
                fontWeight: 700,
                borderRadius: "4px",
                backgroundColor: urgencyColors[priorityBreakdown.urgencyLevel].bg,
                color: "#ffffff",
              }}>
                {urgencyColors[priorityBreakdown.urgencyLevel].label}
              </div>
            )}
          </div>

          {/* Title and Status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
              <h3 style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "#111827",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{title}</h3>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: "6px",
                flexShrink: 0,
              }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: config.color }} />
                <span style={{ fontSize: "12px", fontWeight: 500, color: config.color }}>{config.label}</span>
              </div>
            </div>
            <p style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "0 0 8px 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{description}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
              <MapPin style={{ width: "14px", height: "14px" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
              {ward && ward !== "Unassigned" && (
                <span style={{ padding: "2px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px", fontSize: "12px", fontWeight: 500 }}>{ward}</span>
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        {image && (
          <div style={{ height: "120px", backgroundColor: "#f3f4f6", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
            <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
        )}

        {/* Priority Breakdown Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#f3f4f6", borderRadius: "10px" }}>
            <AlertTriangle style={{ width: "16px", height: "16px", margin: "0 auto 4px", color: "#dc2626" }} />
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Severity</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{severity}/10</div>
            {priorityBreakdown && (
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>+{priorityBreakdown.severityScore}pts</div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#f3f4f6", borderRadius: "10px" }}>
            <TrendingUp style={{ width: "16px", height: "16px", margin: "0 auto 4px", color: "#64748b" }} />
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Upvotes</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{upvotes}</div>
            {priorityBreakdown && (
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>+{priorityBreakdown.upvoteScore}pts</div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#f3f4f6", borderRadius: "10px" }}>
            <Clock style={{ width: "16px", height: "16px", margin: "0 auto 4px", color: "#64748b" }} />
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Pending</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{timeElapsed}</div>
            {priorityBreakdown && (
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>+{priorityBreakdown.timeScore}pts</div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#f3f4f6", borderRadius: "10px" }}>
            <Users style={{ width: "16px", height: "16px", margin: "0 auto 4px", color: "#64748b" }} />
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Category</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{category.split(' ')[0]}</div>
            {priorityBreakdown && (
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>+{priorityBreakdown.categoryScore}pts</div>
            )}
          </div>
        </div>

        {/* ETA Display */}
        {expectedResolutionDays && status !== "resolved" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              backgroundColor: isOverdue ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${isOverdue ? "#fecaca" : "#bbf7d0"}`,
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar style={{ width: "16px", height: "16px", color: isOverdue ? "#dc2626" : "#16a34a" }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: isOverdue ? "#dc2626" : "#166534" }}>
                {isOverdue ? "Overdue" : "ETA"}: {expectedResolutionDays} days
              </span>
            </div>
            <span style={{ fontSize: "12px", color: isOverdue ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
              {isOverdue
                ? `${Math.abs(daysRemaining || 0)} days overdue`
                : daysRemaining !== null && daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "Due today"}
            </span>
          </div>
        )}

        {/* Submitted By and Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ fontSize: "13px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            By: {submittedBy}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); onAcknowledge?.(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <CheckCircle2 style={{ width: "16px", height: "16px" }} />
                Acknowledge
              </button>
            )}
            {status === "acknowledged" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStartProgress?.(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#0369a1",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Play style={{ width: "16px", height: "16px" }} />
                Start Progress
              </button>
            )}
            {status === "in-progress" && (
              <button
                onClick={(e) => { e.stopPropagation(); onResolve?.(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Check style={{ width: "16px", height: "16px" }} />
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        {/* Footer - Category and Blockchain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
          <span style={{ padding: "6px 12px", backgroundColor: "#f3f4f6", fontSize: "12px", fontWeight: 500, borderRadius: "6px", color: "#374151" }}>
            {category}
          </span>
          {verifiedOnChain && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle style={{ width: "14px", height: "14px", color: "#16a34a" }} />
                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 500 }}>Verified</span>
              </div>
              {blockchainTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${blockchainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#1e293b", textDecoration: "none" }}
                >
                  <ExternalLink style={{ width: "12px", height: "12px" }} />
                  View
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
