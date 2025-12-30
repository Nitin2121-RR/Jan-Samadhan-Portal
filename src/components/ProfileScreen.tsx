import { useState, useEffect } from "react";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Award, TrendingUp } from "lucide-react";
import { LocationInput } from "./ui/LocationInput";
import { apiClient } from "../services/api";
import { toast } from "sonner";

interface ProfileScreenProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: string;
  department?: string | null;
  position?: string | null;
}

interface ProfileStats {
  reported: number;
  resolved: number;
  upvotes: number;
}

export function ProfileScreen({ userName, userEmail, onLogout, onNavigate }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ reported: 0, resolved: 0, upvotes: 0 });
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProfile();
      setProfile(response.user);
      setStats(response.stats || { reported: 0, resolved: 0, upvotes: 0 });
      setEditForm({
        name: response.user.name || "",
        phone: response.user.phone || "",
        address: response.user.address || "",
        password: "",
      });
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updateData: Record<string, string | null> = {};
      if (editForm.name && editForm.name !== profile?.name) updateData.name = editForm.name;
      if (editForm.phone !== profile?.phone) updateData.phone = editForm.phone || null;
      if (editForm.address !== profile?.address) updateData.address = editForm.address || null;
      if (editForm.password && editForm.password.length >= 6) updateData.password = editForm.password;

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        setEditDialogOpen(false);
        return;
      }

      const response = await apiClient.updateProfile(updateData);
      setProfile(response.user);
      setEditDialogOpen(false);
      toast.success("Profile updated successfully");
      setEditForm(prev => ({ ...prev, password: "" }));
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const displayName = profile?.name || userName || "User";
  const displayEmail = profile?.email || userEmail || "";
  const displayPhone = profile?.phone || "";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    outline: "none",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTopColor: "#1e293b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User style={{ width: "24px", height: "24px", color: "#64748b" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>Profile</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>Manage your account settings and preferences.</p>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "64px", height: "64px", backgroundColor: "#f1f5f9", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "24px", fontWeight: 600, color: "#1e293b" }}>{getInitials(displayName)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>{displayName}</h2>
          {displayPhone && <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>{displayPhone}</p>}
          {displayEmail && <p style={{ fontSize: "13px", color: "#9ca3af", margin: "2px 0 0 0" }}>{displayEmail}</p>}
        </div>
      </div>

      {/* Contribution Stats */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Your Contribution</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div style={{ backgroundColor: "#f3f4f6", borderRadius: "12px", padding: "20px", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{stats.reported}</p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>Reported</p>
          </div>
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "20px", textAlign: "center", border: "1px solid #86efac" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#16a34a", margin: 0 }}>{stats.resolved}</p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>Resolved</p>
          </div>
          <div style={{ backgroundColor: "#f1f5f9", borderRadius: "12px", padding: "20px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#64748b", margin: 0 }}>{stats.upvotes}</p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>Upvotes</p>
          </div>
        </div>
      </div>

      {/* Citizen Badge */}
      {profile?.role === "citizen" && (
        <div style={{ backgroundColor: "#f1f5f9", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#f8fafc", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award style={{ width: "24px", height: "24px", color: "#1e293b" }} />
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b", margin: 0 }}>Active Citizen</p>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>Level {Math.floor(stats.reported / 5) + 1} • {stats.reported * 10} points</p>
          </div>
        </div>
      )}

      {/* Settings */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>Settings</h3>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {/* Notifications */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell style={{ width: "20px", height: "20px", color: "#6b7280" }} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>Notifications</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>Get updates on your grievances</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "12px",
                backgroundColor: notifications ? "#1e293b" : "#e5e7eb",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background-color 0.2s",
              }}
            >
              <div style={{
                width: "20px",
                height: "20px",
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                position: "absolute",
                top: "2px",
                left: notifications ? "22px" : "2px",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {/* Community Updates */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell style={{ width: "20px", height: "20px", color: "#64748b" }} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>Community Updates</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>Nearby issues & resolutions</p>
              </div>
            </div>
            <button
              onClick={() => setCommunityUpdates(!communityUpdates)}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "12px",
                backgroundColor: communityUpdates ? "#1e293b" : "#e5e7eb",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background-color 0.2s",
              }}
            >
              <div style={{
                width: "20px",
                height: "20px",
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                position: "absolute",
                top: "2px",
                left: communityUpdates ? "22px" : "2px",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {/* Edit Profile */}
          <button
            onClick={() => setEditDialogOpen(true)}
            style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: "20px", height: "20px", color: "#6b7280" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>Edit Profile</span>
            </div>
            <ChevronRight style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
          </button>

          {/* Privacy */}
          <button
            onClick={() => onNavigate?.('privacy')}
            style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield style={{ width: "20px", height: "20px", color: "#6b7280" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>Privacy & Security</span>
            </div>
            <ChevronRight style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
          </button>

          {/* Help */}
          <button
            onClick={() => onNavigate?.('contact')}
            style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HelpCircle style={{ width: "20px", height: "20px", color: "#6b7280" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>Help & Support</span>
            </div>
            <ChevronRight style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
          </button>

          {/* Version */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "20px", height: "20px", color: "#6b7280" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>App Version</span>
            </div>
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <LogOut style={{ width: "18px", height: "18px" }} />
        Logout
      </button>

      {/* Edit Profile Modal */}
      {editDialogOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setEditDialogOpen(false)} />
          <div style={{ position: "relative", zIndex: 1001, width: "100%", maxWidth: "420px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <button onClick={() => setEditDialogOpen(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "20px", color: "#9ca3af", cursor: "pointer" }}>✕</button>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>Edit Profile</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px 0" }}>Update your profile information.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="Enter your name" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Phone</label>
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} placeholder="Enter your phone" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Address</label>
                <LocationInput
                  value={{ address: editForm.address }}
                  onChange={(loc) => setEditForm(prev => ({ ...prev, address: loc.address }))}
                  placeholder="Enter your address"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>New Password (optional)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))} style={inputStyle} placeholder="Min 6 characters" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setEditDialogOpen(false)} disabled={saving} style={{ flex: 1, padding: "12px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving || !editForm.name.trim()} style={{ flex: 1, padding: "12px", backgroundColor: "#1e293b", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: (saving || !editForm.name.trim()) ? 0.7 : 1 }}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
