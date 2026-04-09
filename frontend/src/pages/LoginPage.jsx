import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import HeaderAnimatedTagline from "../components/HeaderAnimatedTagline";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import { useToast } from "../context/ToastContext";
import { APP_NAME, APP_TAGLINE } from "../constants/branding";
import { authApi } from "../services/api";
import useAuth from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/errors";

function parseAuthResponse(response) {
  const data = response?.data ?? {};
  const token = data.token || data.jwt;
  const user = data.user || data.profile || null;
  return { token, user };
}

function LoginPage() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (payload) => {
    setLoading(true);

    try {
      const { email, password, role } = payload;
      
      // Validate role and email match
      if (role) {
        // Check if trying to sign in as wrong role
        const storedRole = localStorage.getItem("role");
        const storedUser = localStorage.getItem("user");
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            const storedEmail = userData.email;
            
            // If stored user email matches, but roles don't match, prevent signin
            if (storedEmail === email && storedRole !== role) {
              error(`Cannot sign in as ${role}. Your account is registered as ${storedRole}.`);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Failed to parse stored user data:", parseError);
          }
        }
      }
      
      // Add volunteer role validation
      if (role === "volunteer") {
        // Check if volunteer is trying to sign in as user
        const storedRole = localStorage.getItem("role");
        const storedUser = localStorage.getItem("user");
        
        if (storedRole === "user" && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            const storedEmail = userData.email;
            
            // If stored email matches, but roles don't match, prevent signin
            if (storedEmail === email) {
              error(`Cannot sign in as volunteer. Your account is registered as User.`);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Failed to parse stored user data:", parseError);
          }
        }
      }
      
      const response = await authApi.login({ email, password, role });

      console.log("LOGIN RESPONSE:", response.data);

      const token = response.data.token;
      const user = response.data.user;

      if (!token || !user) {
        throw new Error("Invalid backend response");
      }

      // Store role in localStorage
      localStorage.setItem("role", user.role || role || "user");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "volunteer") {
        navigate("/volunteer");
      } else {
        navigate("/user");
      }
    } catch (err) {
      console.error("Login error:", err);
      error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer nav={<Navbar />}>
      <div className="mb-12 text-center animate-fade-in">
        <p className="font-display text-sm font-bold tracking-[0.25em] text-purple-300">
          {APP_NAME}
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Welcome back
        </h2>
        <HeaderAnimatedTagline className="mx-auto mt-3 max-w-sm" />
        <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-white/80">
          Sign in to continue to your safety hub
        </p>
      </div>

      <AuthForm
        title="Sign in"
        buttonText="Sign in"
        onSubmit={handleLogin}
        loading={loading}
        footer={
          <>
            New here?{" "}
            <Link
              to="/signup"
              className="font-semibold text-purple-300 transition-colors duration-200 hover:text-purple-200 hover:underline"
            >
              Create account
            </Link>
          </>
        }
      />
    </PageContainer>
  );
}

export default LoginPage;
