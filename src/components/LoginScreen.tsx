import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Scale, Mail, Lock, User, Phone, ArrowLeft, MapPin, Building, Briefcase, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import { authService } from "../services/auth.service";
import { apiClient } from "../services/api";
import { toast } from "sonner";

interface Department {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
}

const AUTHORITY_LEVELS = [
  { value: 'field_officer', label: 'Field Officer', description: 'Subordinate / Field Level' },
  { value: 'gro', label: 'Grievance Redressal Officer', description: 'GRO - Primary handler' },
  { value: 'nodal_officer', label: 'Nodal Public Grievance Officer', description: 'Nodal Officer' },
  { value: 'director', label: 'Director of Grievances', description: 'Department Head' },
] as const;

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; role: "citizen" | "authority" }) => void;
  onBackToLanding?: () => void;
}

export function LoginScreen({ onLogin, onBackToLanding }: LoginScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "citizen" as "citizen" | "authority",
    address: "",
    department: "",
    position: "",
    departmentId: "",
    authorityLevel: "gro" as "director" | "nodal_officer" | "gro" | "field_officer",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    if (isSignup && formData.role === "authority" && departments.length === 0) {
      setLoadingDepts(true);
      apiClient.getDepartments()
        .then(res => setDepartments(res.departments))
        .catch(err => {
          console.error("Failed to fetch departments:", err);
          toast.error("Failed to load departments");
        })
        .finally(() => setLoadingDepts(false));
    }
  }, [isSignup, formData.role, departments.length]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isSignup) {
      if (!formData.name?.trim()) newErrors.name = "Name is required";
      if (!formData.email?.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.phone?.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ""))) {
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
      if (formData.role === "citizen" && !formData.address?.trim()) {
        newErrors.address = "Address is required";
      }
      if (formData.role === "authority") {
        if (!formData.departmentId) newErrors.departmentId = "Department is required";
        if (!formData.position?.trim()) newErrors.position = "Position is required";
        if (!formData.authorityLevel) newErrors.authorityLevel = "Authority level is required";
      }
    } else {
      if (!formData.email?.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.password) newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isSignup) {
        const selectedDept = departments.find(d => d.id === formData.departmentId);
        const response = await authService.signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          address: formData.role === "citizen" ? formData.address : undefined,
          department: formData.role === "authority" ? selectedDept?.name : undefined,
          position: formData.role === "authority" ? formData.position : undefined,
          departmentId: formData.role === "authority" ? formData.departmentId : undefined,
          authorityLevel: formData.role === "authority" ? formData.authorityLevel : undefined,
        });
        onLogin({ name: response.user.name, email: response.user.email, role: response.user.role });
      } else {
        const response = await authService.login(formData.email, formData.password);
        onLogin({ name: response.user.name, email: response.user.email, role: response.user.role });
      }
    } catch (error: any) {
      setErrors({ ...errors, submit: error?.message || (isSignup ? "Signup failed" : "Invalid email or password") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    try {
      await apiClient.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      toast.success("Password reset instructions sent");
    } catch (error: any) {
      setForgotError(error?.message || "Failed to send reset instructions");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotError("");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    padding: "0 12px 0 40px",
    fontSize: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "8px",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "16px",
    height: "16px",
    color: "#9ca3af",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#f8fafc" }}>
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

      {/* Left Brand Panel - Desktop Only */}
      <div
        style={{
          display: "none",
          width: "50%",
          maxWidth: "600px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "48px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        className="login-brand-panel"
      >
        <div>
          <button
            onClick={onBackToLanding}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: "48px",
              fontSize: "14px",
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to home
          </button>

          <div style={{ maxWidth: "400px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "32px",
              }}
            >
              <Scale style={{ width: "32px", height: "32px", color: "#1e293b" }} />
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              Jan-Samadhan Portal
            </h1>
            <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.6 }}>
              Empowering citizens to report issues and enabling authorities to resolve them efficiently with intelligent automation.
            </p>
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px",
              backgroundColor: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#f1f5f9",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>92%</span>
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Satisfaction Rate</p>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Based on citizen feedback</p>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>
            © 2025 Jan-Samadhan Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Mobile Header */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
          className="login-mobile-header"
        >
          <button
            onClick={onBackToLanding}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scale style={{ width: "22px", height: "22px", color: "#1e293b" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Jan-Samadhan</p>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Grievance Management</p>
            </div>
          </button>
        </div>

        {/* Form Container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
            overflowY: "auto",
          }}
        >
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Tab Switcher */}
              <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => { setIsSignup(false); setErrors({}); }}
                  style={{
                    flex: 1,
                    paddingBottom: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    borderBottom: !isSignup ? "2px solid #1e293b" : "2px solid transparent",
                    color: !isSignup ? "#111827" : "#6b7280",
                    cursor: "pointer",
                    marginBottom: "-1px",
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignup(true); setErrors({}); }}
                  style={{
                    flex: 1,
                    paddingBottom: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    borderBottom: isSignup ? "2px solid #1e293b" : "2px solid transparent",
                    color: isSignup ? "#111827" : "#6b7280",
                    cursor: "pointer",
                    marginBottom: "-1px",
                  }}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {isSignup && (
                    <>
                      {/* Name */}
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <div style={{ position: "relative" }}>
                          <User style={iconStyle} />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: "" }); }}
                            style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : "#e5e7eb" }}
                            placeholder="Enter your name"
                          />
                        </div>
                        {errors.name && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.name}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label style={labelStyle}>Phone Number</label>
                        <div style={{ position: "relative" }}>
                          <Phone style={iconStyle} />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                            style={{ ...inputStyle, borderColor: errors.phone ? "#ef4444" : "#e5e7eb" }}
                            placeholder="Enter phone number"
                          />
                        </div>
                        {errors.phone && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.phone}</p>}
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ position: "relative" }}>
                      <Mail style={iconStyle} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: "" }); }}
                        style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : "#e5e7eb" }}
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: "relative" }}>
                      <Lock style={iconStyle} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: "" }); }}
                        style={{ ...inputStyle, borderColor: errors.password ? "#ef4444" : "#e5e7eb" }}
                        placeholder="Enter your password"
                        autoComplete={isSignup ? "new-password" : "current-password"}
                      />
                    </div>
                    {errors.password && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.password}</p>}
                  </div>

                  {isSignup && (
                    <>
                      {/* Confirm Password */}
                      <div>
                        <label style={labelStyle}>Confirm Password</label>
                        <div style={{ position: "relative" }}>
                          <Lock style={iconStyle} />
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" }); }}
                            style={{ ...inputStyle, borderColor: errors.confirmPassword ? "#ef4444" : "#e5e7eb" }}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                          />
                        </div>
                        {errors.confirmPassword && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.confirmPassword}</p>}
                      </div>

                      {/* Role Selection */}
                      <div>
                        <label style={labelStyle}>Register As</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "12px",
                              border: `1px solid ${formData.role === "citizen" ? "#1e293b" : "#e5e7eb"}`,
                              borderRadius: "8px",
                              cursor: "pointer",
                              backgroundColor: formData.role === "citizen" ? "#f1f5f9" : "#ffffff",
                            }}
                          >
                            <input
                              type="radio"
                              name="role"
                              value="citizen"
                              checked={formData.role === "citizen"}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as "citizen" })}
                              style={{ display: "none" }}
                            />
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                border: `2px solid ${formData.role === "citizen" ? "#1e293b" : "#9ca3af"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {formData.role === "citizen" && (
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#1e293b" }} />
                              )}
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>Citizen</span>
                          </label>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "12px",
                              border: `1px solid ${formData.role === "authority" ? "#1e293b" : "#e5e7eb"}`,
                              borderRadius: "8px",
                              cursor: "pointer",
                              backgroundColor: formData.role === "authority" ? "#f1f5f9" : "#ffffff",
                            }}
                          >
                            <input
                              type="radio"
                              name="role"
                              value="authority"
                              checked={formData.role === "authority"}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as "authority" })}
                              style={{ display: "none" }}
                            />
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                border: `2px solid ${formData.role === "authority" ? "#1e293b" : "#9ca3af"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {formData.role === "authority" && (
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#1e293b" }} />
                              )}
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>Authority</span>
                          </label>
                        </div>
                      </div>

                      {/* Citizen Address */}
                      {formData.role === "citizen" && (
                        <div>
                          <label style={labelStyle}>Address</label>
                          <div style={{ position: "relative" }}>
                            <MapPin style={iconStyle} />
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => { setFormData({ ...formData, address: e.target.value }); if (errors.address) setErrors({ ...errors, address: "" }); }}
                              style={{ ...inputStyle, borderColor: errors.address ? "#ef4444" : "#e5e7eb" }}
                              placeholder="Enter your address"
                            />
                          </div>
                          {errors.address && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.address}</p>}
                        </div>
                      )}

                      {/* Authority Fields */}
                      {formData.role === "authority" && (
                        <>
                          {/* Department Dropdown */}
                          <div>
                            <label style={labelStyle}>Department</label>
                            <div style={{ position: "relative" }}>
                              <Building style={iconStyle} />
                              <ChevronDown style={{ ...iconStyle, left: "auto", right: "12px" }} />
                              <select
                                value={formData.departmentId}
                                onChange={(e) => {
                                  setFormData({ ...formData, departmentId: e.target.value });
                                  if (errors.departmentId) setErrors({ ...errors, departmentId: "" });
                                }}
                                disabled={loadingDepts}
                                style={{
                                  ...inputStyle,
                                  paddingRight: "40px",
                                  appearance: "none",
                                  borderColor: errors.departmentId ? "#ef4444" : "#e5e7eb",
                                  color: formData.departmentId ? "#111827" : "#9ca3af",
                                }}
                              >
                                <option value="">
                                  {loadingDepts ? "Loading departments..." : "Select department"}
                                </option>
                                {departments.map((dept) => (
                                  <option key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors.departmentId && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.departmentId}</p>}
                          </div>

                          {/* Authority Level */}
                          <div>
                            <label style={labelStyle}>Authority Level</label>
                            <div style={{ position: "relative" }}>
                              <Briefcase style={iconStyle} />
                              <ChevronDown style={{ ...iconStyle, left: "auto", right: "12px" }} />
                              <select
                                value={formData.authorityLevel}
                                onChange={(e) => {
                                  setFormData({ ...formData, authorityLevel: e.target.value as typeof formData.authorityLevel });
                                  if (errors.authorityLevel) setErrors({ ...errors, authorityLevel: "" });
                                }}
                                style={{
                                  ...inputStyle,
                                  paddingRight: "40px",
                                  appearance: "none",
                                  borderColor: errors.authorityLevel ? "#ef4444" : "#e5e7eb",
                                  color: "#111827",
                                }}
                              >
                                {AUTHORITY_LEVELS.map((level) => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors.authorityLevel && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.authorityLevel}</p>}
                          </div>

                          {/* Position */}
                          <div>
                            <label style={labelStyle}>Position / Designation</label>
                            <div style={{ position: "relative" }}>
                              <User style={iconStyle} />
                              <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => { setFormData({ ...formData, position: e.target.value }); if (errors.position) setErrors({ ...errors, position: "" }); }}
                                style={{ ...inputStyle, borderColor: errors.position ? "#ef4444" : "#e5e7eb" }}
                                placeholder="e.g., Junior Engineer, Executive Officer"
                              />
                            </div>
                            {errors.position && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.position}</p>}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {errors.submit && (
                    <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                      <p style={{ fontSize: "14px", color: "#dc2626", margin: 0 }}>{errors.submit}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      height: "44px",
                      fontSize: "14px",
                      fontWeight: 600,
                      backgroundColor: "#1e293b",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
                  </Button>
                </div>
              </form>

              {!isSignup && (
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      color: "#1e293b",
                      cursor: "pointer",
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "24px" }}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
            onClick={resetForgotPassword}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1001,
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <button
              onClick={resetForgotPassword}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                color: "#9ca3af",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            {forgotSuccess ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "#dcfce7",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <CheckCircle style={{ width: "32px", height: "32px", color: "#16a34a" }} />
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Check Your Email</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
                  If an account exists with <strong>{forgotEmail}</strong>, you will receive password reset instructions shortly.
                </p>
                <Button
                  onClick={resetForgotPassword}
                  style={{
                    width: "100%",
                    height: "44px",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: "#1e293b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>Forgot Password</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ position: "relative" }}>
                      <Mail style={iconStyle} />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotError) setForgotError("");
                        }}
                        style={{ ...inputStyle, borderColor: forgotError ? "#ef4444" : "#e5e7eb" }}
                        placeholder="Enter your email"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {forgotError && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{forgotError}</p>}
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={resetForgotPassword}
                      disabled={forgotLoading}
                      style={{
                        flex: 1,
                        height: "44px",
                        fontSize: "14px",
                        fontWeight: 500,
                        backgroundColor: "#ffffff",
                        color: "#374151",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{
                        flex: 1,
                        height: "44px",
                        fontSize: "14px",
                        fontWeight: 600,
                        backgroundColor: "#1e293b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                        opacity: forgotLoading ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                          Sending...
                        </>
                      ) : (
                        "Send Instructions"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSS for responsive layout */}
      <style>{`
        @media (min-width: 1024px) {
          .login-brand-panel {
            display: flex !important;
          }
          .login-mobile-header {
            display: none !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
