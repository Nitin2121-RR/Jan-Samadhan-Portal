import { useState } from "react";
import { ArrowBigUp, MapPin, Clock, CheckCircle, ExternalLink } from "lucide-react";

interface GrievanceCardProps {
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
  onUpvote?: () => void;
  onClick?: () => void;
  verifiedOnChain?: boolean;
  blockchainTxHash?: string | null;
  contractAddress?: string | null;
}

export function GrievanceCard({
  title,
  description,
  category,
  location,
  status,
  upvotes,
  timeAgo,
  image,
  isUpvoted,
  onUpvote,
  onClick,
  verifiedOnChain,
  blockchainTxHash,
}: GrievanceCardProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = image && !imageError;

  const statusConfig = {
    pending: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0", label: "Pending" },
    "in-progress": { bg: "#f1f5f9", color: "#1e293b", border: "#cbd5e1", label: "In Progress" },
    resolved: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", label: "Resolved" }
  };

  const config = statusConfig[status];

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Image */}
        {showImage && (
          <div style={{ position: "relative", height: "180px", backgroundColor: "#f3f4f6" }}>
            <img
              src={image}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImageError(true)}
            />
            {/* Status badge on image */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: "8px",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: config.color }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: config.color }}>{config.label}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {/* Status badge if no image */}
          {!showImage && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: config.color }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: config.color }}>{config.label}</span>
            </div>
          )}

          {/* Title */}
          <h3
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 8px 0",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "0 0 16px 0",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>

          {/* Location & Time */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
              <span style={{ fontSize: "13px", color: "#6b7280" }}>{location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
              <span style={{ fontSize: "13px", color: "#6b7280" }}>{timeAgo}</span>
            </div>
          </div>

          {/* Category & Upvote */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <span
              style={{
                padding: "6px 12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#374151",
              }}
            >
              {category}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpvote?.();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                backgroundColor: isUpvoted ? "#1e293b" : "#ffffff",
                color: isUpvoted ? "#ffffff" : "#374151",
                border: isUpvoted ? "none" : "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ArrowBigUp style={{ width: "18px", height: "18px", fill: isUpvoted ? "currentColor" : "none" }} />
              {upvotes}
            </button>
          </div>

          {/* Blockchain Verification */}
          {verifiedOnChain && (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle style={{ width: "14px", height: "14px", color: "#16a34a" }} />
                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 500 }}>Verified on Blockchain</span>
              </div>
              {blockchainTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${blockchainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    color: "#1e293b",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink style={{ width: "12px", height: "12px" }} />
                  View on Etherscan
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
