import { useState, useEffect } from "react";
import { PriorityGrievanceCard } from "./PriorityGrievanceCard";
import {
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Map,
  RefreshCw,
  ChevronDown,
  X,
  List
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons for different priority levels
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface PriorityBreakdown {
  totalScore: number;
  severityScore: number;
  upvoteScore: number;
  timeScore: number;
  categoryScore: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}

interface Grievance {
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
  priorityBreakdown?: PriorityBreakdown;
  latitude?: number;
  longitude?: number;
}

interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const categoryColorPalette = ["#1e293b", "#334155", "#475569", "#64748b", "#78716c", "#94a3b8"];

function formatTimeElapsed(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function mapApiStatus(status: string): "pending" | "acknowledged" | "in-progress" | "resolved" {
  switch (status) {
    case "resolved": return "resolved";
    case "in_progress": return "in-progress";
    case "acknowledged": return "acknowledged";
    case "escalated": return "in-progress";
    default: return "pending";
  }
}

// Default map center (New Delhi, India)
const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090];

// Generate random coordinates near a center point for demo
function generateRandomCoords(center: [number, number], index: number): [number, number] {
  const offset = 0.02; // About 2km spread
  const lat = center[0] + (Math.sin(index * 1.5) * offset) + (Math.random() - 0.5) * offset;
  const lng = center[1] + (Math.cos(index * 1.5) * offset) + (Math.random() - 0.5) * offset;
  return [lat, lng];
}

export function AuthorityDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterWard, setFilterWard] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"priority" | "timeline">("priority");
  const [showMapModal, setShowMapModal] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const ward = filterWard !== "all" ? filterWard : undefined;
      const response = await apiClient.getDashboard(ward);

      const mapped = response.grievances.map((g: any, index: number) => {
        // Use actual coordinates if available, otherwise generate demo coordinates
        const coords = g.latitude && g.longitude
          ? [g.latitude, g.longitude] as [number, number]
          : generateRandomCoords(DEFAULT_CENTER, index);

        return {
          id: g.id,
          title: g.title,
          description: g.description,
          category: g.category || "General",
          location: g.address || "Location not specified",
          ward: g.ward || "Unassigned",
          status: mapApiStatus(g.status),
          priorityScore: g.priorityBreakdown?.totalScore || g.priorityScore || 50,
          severity: g.severity || 5,
          duplicates: g.duplicates || 0,
          upvotes: g.upvotes || g._count?.upvotes || 0,
          timeElapsed: formatTimeElapsed(g.createdAt),
          submittedBy: g.user?.name || "Anonymous",
          image: g.files?.[0]?.filepath || g.image,
          isEscalated: g.status === "escalated" || g.isEscalated,
          verifiedOnChain: g.verifiedOnChain,
          blockchainTxHash: g.blockchainTxHash,
          priorityBreakdown: g.priorityBreakdown,
          latitude: coords[0],
          longitude: coords[1],
        };
      });
      setGrievances(mapped);

      if (response.categoryStats && response.categoryStats.length > 0) {
        const total = response.categoryStats.reduce((sum: number, c: any) => sum + c.count, 0);
        const mappedCategories = response.categoryStats.map((c: any, i: number) => ({
          name: c.category || c.name || "Other",
          count: c.count || c._count || 0,
          percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
          color: categoryColorPalette[i % categoryColorPalette.length],
        }));
        setCategoryData(mappedCategories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filterWard]);

  const handleAcknowledge = async (id: string) => {
    try {
      await apiClient.acknowledgeGrievance(id);
      toast.success("Grievance acknowledged", {
        description: "You can now set an ETA and assign resources"
      });
      setGrievances(prev => prev.map(g =>
        g.id === id ? { ...g, status: "acknowledged" as const } : g
      ));
    } catch (err) {
      toast.error("Failed to acknowledge grievance");
    }
  };

  const filteredGrievances = grievances
    .filter(g => {
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const pendingCount = grievances.filter(g => g.status === "pending").length;
  const inProgressCount = grievances.filter(g => g.status === "in-progress" || g.status === "acknowledged").length;
  const escalatedCount = grievances.filter(g => g.isEscalated).length;

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    padding: "10px 36px 10px 40px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
    minWidth: "160px",
  };

  if (loading && grievances.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTopColor: "#1e293b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#6b7280", marginTop: "16px" }}>Loading dashboard...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && grievances.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <AlertCircle style={{ width: "48px", height: "48px", color: "#dc2626", marginBottom: "16px" }} />
        <p style={{ color: "#dc2626", fontWeight: 500, marginBottom: "16px" }}>{error}</p>
        <button
          onClick={fetchDashboard}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", cursor: "pointer" }}
        >
          <RefreshCw style={{ width: "16px", height: "16px" }} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Map style={{ width: "24px", height: "24px", color: "#64748b" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>Authority Dashboard</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>{filterWard !== "all" ? filterWard : "All Wards"} • Municipal Authority</p>
          </div>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          style={{ width: "40px", height: "40px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <RefreshCw style={{ width: "18px", height: "18px", color: "#6b7280", animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#fef2f2", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <AlertCircle style={{ width: "22px", height: "22px", color: "#dc2626" }} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{pendingCount}</p>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>Pending</p>
        </div>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Clock style={{ width: "22px", height: "22px", color: "#64748b" }} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{inProgressCount}</p>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>In Progress</p>
        </div>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <TrendingUp style={{ width: "22px", height: "22px", color: "#64748b" }} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{escalatedCount}</p>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>Escalated</p>
        </div>
      </div>

      {/* Priority Distribution */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Priority Distribution</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <div style={{ padding: "16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#dc2626", margin: 0 }}>
              {grievances.filter(g => g.priorityBreakdown?.urgencyLevel === 'critical').length}
            </p>
            <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0 0" }}>Critical</p>
          </div>
          <div style={{ padding: "16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#78716c", margin: 0 }}>
              {grievances.filter(g => g.priorityBreakdown?.urgencyLevel === 'high').length}
            </p>
            <p style={{ fontSize: "12px", color: "#78716c", margin: "4px 0 0 0" }}>High</p>
          </div>
          <div style={{ padding: "16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#64748b", margin: 0 }}>
              {grievances.filter(g => g.priorityBreakdown?.urgencyLevel === 'medium').length}
            </p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Medium</p>
          </div>
          <div style={{ padding: "16px", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#16a34a", margin: 0 }}>
              {grievances.filter(g => g.priorityBreakdown?.urgencyLevel === 'low').length}
            </p>
            <p style={{ fontSize: "12px", color: "#16a34a", margin: "4px 0 0 0" }}>Low</p>
          </div>
        </div>
      </div>

      {/* Grievances by Category */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Grievances by Category</h3>
        {categoryData.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {categoryData.map((category, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>{category.name}</span>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{category.percentage}% ({category.count})</span>
                </div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "#f3f4f6", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${category.percentage}%`, backgroundColor: category.color, borderRadius: "5px", transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", padding: "16px 0" }}>No category data available</p>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <MapPin style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <ChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)} style={selectStyle}>
            <option value="all">All Wards</option>
            <option value="ward-42">Ward 42 (Your Ward)</option>
          </select>
        </div>

        <div style={{ position: "relative" }}>
          <Filter style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <ChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Priority Queue Info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
          <Flame style={{ width: "16px", height: "16px", color: "#64748b" }} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>{filteredGrievances.length} Issues - Priority Sorted</span>
        </div>
        <button
          onClick={() => setShowMapModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#1e293b", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
        >
          <Map style={{ width: "16px", height: "16px" }} />
          View Map
        </button>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: "#f3f4f6", borderRadius: "12px", padding: "4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        <button
          onClick={() => setActiveTab("priority")}
          style={{
            padding: "12px 16px",
            backgroundColor: activeTab === "priority" ? "#ffffff" : "transparent",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: activeTab === "priority" ? "#111827" : "#6b7280",
            cursor: "pointer",
            boxShadow: activeTab === "priority" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          Priority Queue
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          style={{
            padding: "12px 16px",
            backgroundColor: activeTab === "timeline" ? "#ffffff" : "transparent",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: activeTab === "timeline" ? "#111827" : "#6b7280",
            cursor: "pointer",
            boxShadow: activeTab === "timeline" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          Timeline View
        </button>
      </div>

      {/* Grievances List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {activeTab === "priority" && filteredGrievances.map((grievance) => (
          <PriorityGrievanceCard
            key={grievance.id}
            {...grievance}
            onAcknowledge={() => handleAcknowledge(grievance.id)}
          />
        ))}
        {activeTab === "timeline" && filteredGrievances
          .sort((a, b) => {
            const timeValue = (time: string) => {
              if (time.includes('h')) return parseInt(time) / 24;
              return parseInt(time);
            };
            return timeValue(a.timeElapsed) - timeValue(b.timeElapsed);
          })
          .map((grievance) => (
            <PriorityGrievanceCard
              key={grievance.id}
              {...grievance}
              onAcknowledge={() => handleAcknowledge(grievance.id)}
            />
          ))}
      </div>

      {/* Empty State */}
      {filteredGrievances.length === 0 && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "48px", border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle2 style={{ width: "24px", height: "24px", color: "#16a34a" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111827", margin: 0 }}>No issues found</p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>All caught up!</p>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setShowMapModal(false)} />
          <div style={{ position: "relative", zIndex: 1001, width: "100%", maxWidth: "900px", height: "80vh", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#f1f5f9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Map style={{ width: "20px", height: "20px", color: "#64748b" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Grievances Map</h2>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>{filteredGrievances.length} issues in view</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setShowMapModal(false)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "#f3f4f6", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}
                >
                  <List style={{ width: "16px", height: "16px" }} />
                  List View
                </button>
                <button
                  onClick={() => setShowMapModal(false)}
                  style={{ width: "36px", height: "36px", backgroundColor: "#f3f4f6", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X style={{ width: "18px", height: "18px", color: "#6b7280" }} />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div style={{ padding: "12px 24px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Priority:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#991b1b" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Critical</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#78716c" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>High</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#64748b" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Medium</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#166534" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Low</span>
              </div>
            </div>

            {/* Map Container */}
            <div style={{ flex: 1, position: "relative" }}>
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredGrievances.map((grievance) => {
                  if (!grievance.latitude || !grievance.longitude) return null;

                  // Determine marker color based on priority
                  let markerColor = "#166534"; // low - muted green
                  if (grievance.priorityBreakdown?.urgencyLevel === "critical") markerColor = "#991b1b";
                  else if (grievance.priorityBreakdown?.urgencyLevel === "high") markerColor = "#78716c";
                  else if (grievance.priorityBreakdown?.urgencyLevel === "medium") markerColor = "#64748b";
                  else if (grievance.priorityScore >= 80) markerColor = "#991b1b";
                  else if (grievance.priorityScore >= 60) markerColor = "#78716c";
                  else if (grievance.priorityScore >= 40) markerColor = "#64748b";

                  return (
                    <Marker
                      key={grievance.id}
                      position={[grievance.latitude, grievance.longitude]}
                      icon={createCustomIcon(markerColor)}
                    >
                      <Popup>
                        <div style={{ minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{
                              padding: "4px 8px",
                              backgroundColor: markerColor,
                              color: "#ffffff",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}>
                              Score: {grievance.priorityScore}
                            </div>
                            <span style={{
                              padding: "4px 8px",
                              backgroundColor: "#f3f4f6",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 500,
                            }}>
                              {grievance.status}
                            </span>
                          </div>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                            {grievance.title}
                          </h4>
                          <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>
                            {grievance.description.slice(0, 100)}...
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#9ca3af" }}>
                            <MapPin style={{ width: "12px", height: "12px" }} />
                            {grievance.location}
                          </div>
                          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                            <span style={{ color: "#6b7280" }}>{grievance.category}</span>
                            <span style={{ color: "#9ca3af" }}>{grievance.timeElapsed} ago</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
