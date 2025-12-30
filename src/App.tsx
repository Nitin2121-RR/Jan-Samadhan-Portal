import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { FileGrievanceForm } from "./components/FileGrievanceForm";
import { LandingPage } from "./components/LandingPage";
import { LoginScreen } from "./components/LoginScreen";
import { PWAInstaller } from "./components/PWAInstaller";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { PrivacyPolicy } from "./components/pages/PrivacyPolicy";
import { TermsOfService } from "./components/pages/TermsOfService";
import { ContactUs } from "./components/pages/ContactUs";
import { BlockchainEventsNotification } from "./components/BlockchainEventsNotification";
import { Home, Users, PlusCircle, FileText, User, LogOut, Scale } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

const CommunityFeed = lazy(() => import("./components/CommunityFeed").then(m => ({ default: m.CommunityFeed })));
const MyGrievances = lazy(() => import("./components/MyGrievances").then(m => ({ default: m.MyGrievances })));
const ProfileScreen = lazy(() => import("./components/ProfileScreen").then(m => ({ default: m.ProfileScreen })));
const AuthorityDashboard = lazy(() => import("./components/AuthorityDashboard").then(m => ({ default: m.AuthorityDashboard })));

type Screen = "home" | "community" | "file" | "track" | "profile";
type UserRole = "citizen" | "authority";

interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [showFileForm, setShowFileForm] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("citizen");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [currentPage, setCurrentPage] = useState<"main" | "privacy" | "terms" | "contact">("main");

  useEffect(() => {
    const storedAuth = localStorage.getItem("jansamadhan_auth");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const user = parsed.user || parsed;
        setAuthUser(user);
        setUserRole(user.role);
        setIsAuthenticated(true);
        setShowLanding(false);
      } catch {
        localStorage.removeItem("jansamadhan_auth");
      }
    }
  }, []);

  const handleGetStarted = () => setShowLanding(false);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    setUserRole(user.role);
    setIsAuthenticated(true);
    toast.success(`Welcome ${user.name}!`, {
      description: `Logged in as ${user.role === "citizen" ? "Citizen" : "Authority"}`
    });
  };

  const handleLogout = () => {
    setAuthUser(null);
    setIsAuthenticated(false);
    setActiveScreen("home");
    setShowFileForm(false);
    setShowLanding(true);
    localStorage.removeItem("jansamadhan_auth");
    toast.info("Logged out successfully");
  };

  const handleFileGrievance = () => {
    setShowFileForm(true);
    setActiveScreen("file");
  };

  const handleSubmitGrievance = () => {
    setShowFileForm(false);
    setActiveScreen("track");
    toast.success("Grievance submitted successfully!", {
      description: "You'll receive updates via SMS and notifications"
    });
  };

  const handleCancelForm = () => {
    setShowFileForm(false);
    setActiveScreen("home");
  };

  const navItems = useMemo(() => [
    { id: "home" as Screen, label: "Overview", icon: Home },
    { id: "community" as Screen, label: "Community", icon: Users },
    { id: "file" as Screen, label: "File", icon: PlusCircle },
    { id: "track" as Screen, label: "My Cases", icon: FileText },
    { id: "profile" as Screen, label: "Profile", icon: User }
  ], []);

  const handlePageNavigate = (page: string) => {
    if (page === "privacy" || page === "terms" || page === "contact") {
      setCurrentPage(page);
    }
  };

  const handleBackToLanding = () => setCurrentPage("main");

  const isCitizen = userRole === "citizen";
  const userInitials = useMemo(() => {
    if (!authUser?.name) return isCitizen ? "C" : "A";
    return authUser.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  }, [authUser?.name, isCitizen]);

  // Static pages
  if (currentPage === "privacy") return <><PrivacyPolicy onBack={handleBackToLanding} /><Toaster /></>;
  if (currentPage === "terms") return <><TermsOfService onBack={handleBackToLanding} /><Toaster /></>;
  if (currentPage === "contact") return <><ContactUs onBack={handleBackToLanding} /><Toaster /></>;

  // Landing page
  if (showLanding) return <><LandingPage onGetStarted={handleGetStarted} onNavigate={handlePageNavigate} /><Toaster /><PWAInstaller /></>;

  // Login screen
  if (!isAuthenticated) return <><LoginScreen onLogin={handleLogin} onBackToLanding={() => setShowLanding(true)} /><Toaster /><PWAInstaller /></>;

  // Main app shell with inline styles
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Top border accent */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", backgroundColor: "#1e293b", zIndex: 1000 }} />

      <div style={{ display: "flex", minHeight: "100vh", paddingTop: "3px" }}>
        {/* Sidebar - Desktop */}
        <aside className="app-sidebar" style={{ display: "none", width: "280px", flexDirection: "column", backgroundColor: "#ffffff", borderRight: "1px solid #e5e7eb", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "32px 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Scale style={{ width: "24px", height: "24px", color: "#1e293b" }} />
              </div>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Jan-Samadhan</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{isCitizen ? "Citizen Workspace" : "Authority Console"}</p>
              </div>
            </div>
          </div>

          {/* Navigation Label */}
          <div style={{ padding: "0 24px 8px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", margin: 0 }}>Navigation</p>
          </div>

          {/* Nav Items */}
          <nav style={{ flex: 1, padding: "0 16px" }}>
            {isCitizen ? (
              navItems.filter((item: any) => item.id !== "file").map((item: any) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setShowFileForm(false); setActiveScreen(item.id); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 12px",
                      marginBottom: "4px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: isActive ? "#f1f5f9" : "transparent",
                      color: isActive ? "#1e293b" : "#64748b",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Icon style={{ width: "18px", height: "18px" }} />
                    <span>{item.label}</span>
                  </button>
                );
              })
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", backgroundColor: "#f1f5f9", borderRadius: "8px", color: "#1e293b", fontSize: "14px", fontWeight: 500 }}>
                <Home style={{ width: "18px", height: "18px" }} />
                <span>Dashboard</span>
              </div>
            )}
          </nav>

          {/* File Grievance Button */}
          {isCitizen && (
            <div style={{ padding: "16px 24px" }}>
              <button
                onClick={handleFileGrievance}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(30, 41, 59, 0.2)",
                }}
              >
                <PlusCircle style={{ width: "18px", height: "18px" }} />
                File a Grievance
              </button>
            </div>
          )}

          {/* User Profile */}
          <div style={{ padding: "16px 24px 24px" }}>
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600 }}>
                  {userInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser?.name || "User"}</p>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser?.email || "Signed in"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  marginTop: "12px",
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  color: "#6b7280",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <LogOut style={{ width: "16px", height: "16px" }} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          <header style={{ position: "sticky", top: "4px", zIndex: 40, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", gap: "16px" }}>
              {/* Mobile Logo */}
              <div className="app-mobile-logo" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Scale style={{ width: "20px", height: "20px", color: "#1e293b" }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Jan-Samadhan</p>
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{isCitizen ? "Citizen Workspace" : "Authority Console"}</p>
                </div>
              </div>

              {/* Desktop Welcome */}
              <div className="app-desktop-welcome" style={{ display: "none", flexDirection: "column" }}>
                <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", margin: 0 }}>{isCitizen ? "Citizen Portal" : "Authority Portal"}</p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Welcome back{authUser?.name ? `, ${authUser.name.split(" ")[0]}` : ""}</p>
              </div>

              {/* Header Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isCitizen && (
                  <button
                    onClick={handleFileGrievance}
                    className="app-mobile-action"
                    style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: "none", borderRadius: "8px", color: "#6b7280", cursor: "pointer" }}
                  >
                    <PlusCircle style={{ width: "20px", height: "20px" }} />
                  </button>
                )}
                {isCitizen && (
                  <button
                    onClick={() => { setShowFileForm(false); setActiveScreen("profile"); }}
                    className="app-mobile-action"
                    style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: "none", borderRadius: "8px", color: "#6b7280", cursor: "pointer" }}
                  >
                    <User style={{ width: "20px", height: "20px" }} />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="app-mobile-action"
                  style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: "none", borderRadius: "8px", color: "#6b7280", cursor: "pointer" }}
                >
                  <LogOut style={{ width: "20px", height: "20px" }} />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              {userRole === "authority" ? (
                <Suspense fallback={<LoadingSpinner />}>
                  <AuthorityDashboard />
                </Suspense>
              ) : (
                <>
                  {activeScreen === "home" && !showFileForm && <HomeScreen onFileGrievance={handleFileGrievance} />}
                  {activeScreen === "community" && <Suspense fallback={<LoadingSpinner />}><CommunityFeed /></Suspense>}
                  {(activeScreen === "file" || showFileForm) && <FileGrievanceForm onSubmit={handleSubmitGrievance} onCancel={handleCancelForm} />}
                  {activeScreen === "track" && <Suspense fallback={<LoadingSpinner />}><MyGrievances /></Suspense>}
                  {activeScreen === "profile" && <Suspense fallback={<LoadingSpinner />}><ProfileScreen userName={authUser?.name} userEmail={authUser?.email} onLogout={handleLogout} onNavigate={handlePageNavigate} /></Suspense>}
                </>
              )}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          {isCitizen && (
            <nav className="app-mobile-nav" style={{ display: "flex", position: "fixed", bottom: "12px", left: "12px", right: "12px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb", zIndex: 50, padding: "8px" }}>
              {navItems.map((item: any) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                const isFileButton = item.id === "file";

                if (isFileButton) {
                  return (
                    <button
                      key={item.id}
                      onClick={handleFileGrievance}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "56px",
                        height: "56px",
                        marginTop: "-28px",
                        backgroundColor: "#1e293b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "16px",
                        boxShadow: "0 4px 12px rgba(30,41,59,0.3)",
                        cursor: "pointer",
                      }}
                    >
                      <Icon style={{ width: "24px", height: "24px" }} />
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => { setShowFileForm(false); setActiveScreen(item.id); }}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                      padding: "8px 4px",
                      backgroundColor: isActive ? "#f1f5f9" : "transparent",
                      border: "none",
                      borderRadius: "12px",
                      color: isActive ? "#1e293b" : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    <Icon style={{ width: "20px", height: "20px" }} />
                    <span style={{ fontSize: "11px", fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      <Toaster />
      <PWAInstaller />
      <BlockchainEventsNotification showToasts={true} maxToasts={3} />

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .app-sidebar { display: flex !important; }
          .app-mobile-logo { display: none !important; }
          .app-desktop-welcome { display: flex !important; }
          .app-mobile-action { display: none !important; }
          .app-mobile-nav { display: none !important; }
        }
        @media (max-width: 1023px) {
          .app-desktop-welcome { display: none !important; }
        }
      `}</style>
    </div>
  );
}
