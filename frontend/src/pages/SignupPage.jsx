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

function SignupPage() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSignup = async (payload) => {
    setLoading(true);

    try {
      const { email, password, firstName, lastName, phone, role } = payload;
      // Combine first and last name
      const name = `${firstName} ${lastName}`.trim();
      
      console.log("Signup payload:", { email, password, name, phone, role });
      
      const response = await authApi.signup({
        email,
        password,
        name,
        phone,
        role: role || "user",
      });
      
      console.log("Signup response:", response.data);
      
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
      console.error("Signup error:", err);
      error(err?.response?.data?.message || "Unable to create account.");
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
          Create account
        </h2>
        <HeaderAnimatedTagline className="mx-auto mt-3 max-w-sm" />
        <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-white/80">
          Join our safety community · {APP_TAGLINE}
        </p>
      </div>

      <AuthForm
        title="Create account"
        buttonText="Create account"
        onSubmit={handleSignup}
        loading={loading}
        footer={
          <>
            Already have an account?{" "}
            <Link
              to="/"
              className="font-semibold text-purple-300 transition-colors duration-200 hover:text-purple-200 hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      />
    </PageContainer>
  );
}

export default SignupPage;
