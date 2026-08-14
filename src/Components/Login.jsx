import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/login.css";

const API_URL = "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = () => {
    setIsRegister((previous) => !previous);

    setName("");
    setEmail("");
    setPassword("");

    setShowPassword(false);
    clearMessages();
  };

  // ================================
  // LOGIN
  // ================================

  const handleLogin = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password."
        );
      }

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Save JWT token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setSuccess("Login successful. Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // REGISTER
  // ================================

  const handleRegister = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create account."
        );
      }

      setSuccess(
        "Account created successfully. You can now login."
      );

      setName("");
      setPassword("");

      setTimeout(() => {
        setIsRegister(false);
        setSuccess("");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRAND SECTION */}
      <div className="login-brand-section">

        <div className="brand-content">

          <div className="brand-logo">
            E
          </div>

          <h1>
            Employee
            <br />
            Management
          </h1>

          <p>
            A simple and secure platform to
            manage your organization's
            employees.
          </p>

          <div className="brand-features">

            <div className="brand-feature">
              <span>✓</span>

              <div>
                <strong>Easy Management</strong>
                <small>
                  Manage employee information easily.
                </small>
              </div>
            </div>

            <div className="brand-feature">
              <span>✓</span>

              <div>
                <strong>Secure Access</strong>
                <small>
                  JWT-based authentication.
                </small>
              </div>
            </div>

            <div className="brand-feature">
              <span>✓</span>

              <div>
                <strong>Role Based Access</strong>
                <small>
                  Administrator and User permissions.
                </small>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="login-form-section">

        <div className="login-card">

          {/* HEADER */}
          <div className="login-header">

            <span className="login-eyebrow">
              {isRegister
                ? "CREATE ACCOUNT"
                : "WELCOME BACK"}
            </span>

            <h2>
              {isRegister
                ? "Create your account"
                : "Sign in to your account"}
            </h2>

            <p>
              {isRegister
                ? "Register to access the employee management system."
                : "Enter your credentials to continue."}
            </p>

          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="login-message error-message">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="login-message success-message">
              <span>✓</span>
              <p>{success}</p>
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={
              isRegister
                ? handleRegister
                : handleLogin
            }
          >

            {/* NAME */}
            {isRegister && (
              <div className="login-form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    autoComplete="name"
                  />

                </div>
              </div>
            )}

            {/* EMAIL */}
            <div className="login-form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                />

              </div>
            </div>

            {/* PASSWORD */}
            <div className="login-form-group">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

              </div>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete={
                    isRegister
                      ? "new-password"
                      : "current-password"
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "○"}
                </button>

              </div>

              {isRegister && (
                <small className="password-hint">
                  Password must contain at least
                  6 characters.
                </small>
              )}

            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="button-spinner"></span>

                  {isRegister
                    ? "Creating account..."
                    : "Signing in..."}
                </>
              ) : (
                <>
                  {isRegister
                    ? "Create Account"
                    : "Sign In"}

                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* SWITCH LOGIN / REGISTER */}
          <div className="login-switch">

            <span>
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isRegister
                ? "Sign In"
                : "Create Account"}
            </button>

          </div>

          {/* FOOTER */}
          <div className="login-footer">

            <span>
              🔐 Secure authentication
            </span>

            <span>•</span>

            <span>
              Employee Management System
            </span>

          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;