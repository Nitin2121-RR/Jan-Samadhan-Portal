import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Scale, Zap, Bell, Users, Shield, BarChart, MessageSquare, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigate?: (page: string) => void;
}

export function LandingPage({ onGetStarted, onNavigate }: LandingPageProps) {
  const [stats, setStats] = useState([
    { value: "0", label: "Active Citizens" },
    { value: "0", label: "Resolved Issues" },
    { value: "95%", label: "Satisfaction" }
  ]);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/grievances/community?limit=1`);
        if (response.ok) {
          const data = await response.json();
          const total = data.pagination?.total || 0;

          const resolvedRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/grievances/community?status=resolved&limit=1`);
          let resolved = 0;
          if (resolvedRes.ok) {
            const resolvedData = await resolvedRes.json();
            resolved = resolvedData.pagination?.total || 0;
          }

          const formatNumber = (num: number) => {
            if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
            return num.toString();
          };

          setStats([
            { value: `${formatNumber(total)}+`, label: "Active Citizens" },
            { value: formatNumber(resolved), label: "Resolved Issues" },
            { value: "95%", label: "Satisfaction" }
          ]);
        }
      } catch {
        // Keep defaults on error
      }
    };

    fetchPublicStats();
  }, []);

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Categorization",
      description: "Automatic classification and priority ranking using machine learning",
      color: "bg-slate-100 text-slate-600"
    },
    {
      icon: Bell,
      title: "Real-Time Tracking",
      description: "Instant updates on grievance status via SMS and notifications",
      color: "bg-slate-100 text-slate-600"
    },
    {
      icon: Users,
      title: "Community Engagement",
      description: "View and upvote community grievances to amplify issues",
      color: "bg-slate-100 text-slate-600"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Encrypted data with anonymous reporting options",
      color: "bg-slate-100 text-slate-600"
    },
    {
      icon: BarChart,
      title: "Authority Dashboard",
      description: "Analytics and priority-based issue management",
      color: "bg-slate-100 text-slate-600"
    },
    {
      icon: MessageSquare,
      title: "Multilingual Support",
      description: "File grievances in your preferred language",
      color: "bg-slate-100 text-slate-600"
    }
  ];

  const steps = [
    { number: 1, title: "Report Issue", description: "Submit with photos and location" },
    { number: 2, title: "AI Analysis", description: "Auto-categorize and prioritize" },
    { number: 3, title: "Authority Action", description: "Department works on resolution" },
    { number: 4, title: "Track & Close", description: "Monitor and confirm resolution" }
  ];

  const benefits = {
    citizens: [
      "Quick issue reporting in under 2 minutes",
      "Complete transparency on resolution",
      "Community support through upvoting",
      "Works seamlessly on all devices"
    ],
    authorities: [
      "AI-driven prioritization",
      "Comprehensive analytics dashboard",
      "Automatic duplicate detection",
      "Performance metrics tracking"
    ]
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Top border accent */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "#1e293b",
          zIndex: 1000
        }}
      />

      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          paddingTop: "40px",
          paddingBottom: "40px",
          background: "linear-gradient(180deg, #f1f5f9 0%, #ffffff 50%, #f8fafc 100%)",
          borderBottom: "1px solid #e2e8f0",
          overflow: "hidden"
        }}
      >

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px", position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#f1f5f9",
                borderRadius: "9999px",
                border: "1px solid #e2e8f0"
              }}
            >
              <Sparkles style={{ width: "16px", height: "16px", color: "#64748b" }} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>AI-Powered Governance</span>
            </div>
          </div>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Scale style={{ width: "40px", height: "40px", color: "#1f2937" }} />
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 56px)",
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.1,
                marginBottom: "20px"
              }}
            >
              Jan-Samadhan Portal
            </h1>
            <p
              style={{
                fontSize: "clamp(14px, 2vw, 18px)",
                color: "#4b5563",
                lineHeight: 1.6,
                marginBottom: "8px"
              }}
            >
              India's First AI-Powered Public Grievance Management System
            </p>
            <p
              style={{
                fontSize: "clamp(14px, 1.5vw, 16px)",
                color: "#6b7280",
                lineHeight: 1.6,
                marginBottom: "40px"
              }}
            >
              Empowering citizens to report issues and enabling authorities to resolve them efficiently with intelligent automation and real-time tracking.
            </p>
          </div>

          {/* CTA Button */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "60px" }}>
            <Button
              onClick={onGetStarted}
              size="lg"
              style={{
                backgroundColor: "#1e293b",
                color: "#ffffff",
                padding: "16px 40px",
                fontSize: "18px",
                fontWeight: 600,
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(30,41,59,0.2)"
              }}
            >
              Get Started
              <ArrowRight style={{ width: "20px", height: "20px" }} />
            </Button>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              maxWidth: "600px",
              margin: "0 auto"
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px 16px",
                  textAlign: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  border: "1px solid #e5e7eb"
                }}
              >
                <p style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "40px 16px", backgroundColor: "#f8fafc" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              Intelligent Grievance Management
            </h2>
            <p style={{ fontSize: "16px", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
              Powered by AI to ensure your voice is heard and issues are resolved efficiently
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px"
            }}
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "28px",
                    border: "1px solid #e2e8f0",
                    transition: "box-shadow 0.2s, transform 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className={feature.color}
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px"
                    }}
                  >
                    <Icon style={{ width: "26px", height: "26px" }} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "40px 16px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              How It Works
            </h2>
            <p style={{ fontSize: "16px", color: "#6b7280" }}>
              Simple, fast, and effective grievance resolution
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px"
            }}
          >
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "#1e293b",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    boxShadow: "0 4px 14px rgba(30,41,59,0.2)"
                  }}
                >
                  <span style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff" }}>{step.number}</span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: "40px 16px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "32px"
            }}
          >
            {/* Citizens */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "32px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Users style={{ width: "26px", height: "26px", color: "#1e293b" }} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#111827" }}>For Citizens</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {benefits.citizens.map((benefit, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px"
                      }}
                    >
                      <CheckCircle style={{ width: "14px", height: "14px", color: "#166534" }} />
                    </div>
                    <span style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.5 }}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Authorities */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "32px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Shield style={{ width: "26px", height: "26px", color: "#1e293b" }} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#111827" }}>For Authorities</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {benefits.authorities.map((benefit, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px"
                      }}
                    >
                      <CheckCircle style={{ width: "14px", height: "14px", color: "#1e293b" }} />
                    </div>
                    <span style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.5 }}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "40px 16px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
            Ready to Make a Difference?
          </h2>
          <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "40px" }}>
            Join thousands of citizens working together for a better community
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            style={{
              backgroundColor: "#1e293b",
              color: "#ffffff",
              padding: "16px 40px",
              fontSize: "18px",
              fontWeight: 600,
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(30,41,59,0.2)"
            }}
          >
            Start Using Jan-Samadhan
            <ArrowRight style={{ width: "20px", height: "20px" }} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "32px 16px",
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e2e8f0"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "#f1f5f9",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Scale style={{ width: "22px", height: "22px", color: "#1e293b" }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>Jan-Samadhan Portal</span>
          </div>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
            AI-Powered Public Grievance Management System
          </p>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>
            © 2025 Jan-Samadhan Portal. All rights reserved.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "32px" }}>
            <button
              onClick={() => onNavigate?.('privacy')}
              style={{
                background: "none",
                border: "none",
                fontSize: "14px",
                color: "#6b7280",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate?.('terms')}
              style={{
                background: "none",
                border: "none",
                fontSize: "14px",
                color: "#6b7280",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate?.('contact')}
              style={{
                background: "none",
                border: "none",
                fontSize: "14px",
                color: "#6b7280",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
