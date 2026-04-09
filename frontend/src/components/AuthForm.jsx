import { useState } from "react";
import ButtonSpinner from "./ButtonSpinner";

const ROLES = {
  USER: "user",
  VOLUNTEER: "volunteer",
};

function AuthForm({
  title = "Sign in",
  buttonText = "Continue",
  onSubmit,
  loading = false,
  footer = null,
}) {
  const isSignup = String(title || "").toLowerCase().includes("create") || 
                   String(title || "").toLowerCase().includes("signup") ||
                   String(title || "").toLowerCase() === "create account" ||
                   buttonText?.toLowerCase().includes("create") ||
                   buttonText?.toLowerCase().includes("signup");

  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Only show these fields for signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  
  // Show these fields for both signup and signin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName") setFirstName(value);
    else if (name === "lastName") setLastName(value);
    else if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
    else if (name === "phone") setPhone(value);
    else if (name === "role") setRole(value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (typeof onSubmit === "function") {
      const payload = isSignup 
        ? {
            email,
            password,
            name: `${firstName} ${lastName}`.trim(),
            phone,
            role
          }
        : {
            email,
            password
          };
      
      onSubmit(payload);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md glass-card p-8 animate-slide-up">
      <h1 className="mb-3 text-center font-display text-4xl font-bold tracking-tight text-white">
        {isSignup ? "Create an account" : "Welcome back"}
      </h1>
      <p className="mb-8 text-center text-base font-medium text-white/70">
        {isSignup ? "Join our safety community" : "Sign in to continue"}
      </p>

      {isSignup && (
        <div className="mb-8">
          <div className="flex rounded-2xl border border-white/20 bg-white/5 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setRole(ROLES.USER)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                role === ROLES.USER
                  ? "bg-teal-500/20 text-teal-200 shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              👤 User
            </button>
            <button
              type="button"
              onClick={() => setRole(ROLES.VOLUNTEER)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                role === ROLES.VOLUNTEER
                  ? "bg-teal-500/20 text-teal-200 shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              🛡️ Volunteer
            </button>
          </div>
          <p className="mt-3 text-center text-sm text-white/50">
            {role === "user" 
              ? "Get help when you need it most" 
              : "Help keep your community safe"}
          </p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {isSignup && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/90">
                  First Name
                </label>
                <input
                  name="firstName"
                  required
                  value={firstName}
                  onChange={handleChange}
                  className="glass-input"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/90">
                  Last Name
                </label>
                <input
                  name="lastName"
                  required
                  value={lastName}
                  onChange={handleChange}
                  className="glass-input"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/90">
                Phone
              </label>
              <input
                name="phone"
                required
                value={phone}
                onChange={handleChange}
                className="glass-input"
                placeholder="9876543210"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-white/90">Email</label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={handleChange}
            className="glass-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-white/90">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={handleChange}
              className="glass-input pr-12"
              placeholder="•••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isSignup && (
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-teal-500 focus:ring-teal-500 focus:ring-2"
              required
            />
            <label htmlFor="terms" className="text-sm text-white/70 leading-relaxed">
              I agree to Terms & Conditions and Privacy Policy
            </label>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="submit"
            disabled={loading || (isSignup && !agreedToTerms)}
            className="glass-button-primary w-full py-4 text-lg font-semibold"
          >
            {loading ? (
              <>
                <ButtonSpinner className="h-5 w-5 text-white" />
                <span>Please wait…</span>
              </>
            ) : (
              buttonText
            )}
          </button>

          {isSignup && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-transparent px-4 text-white/60">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                className="glass-social-button"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                className="glass-social-button"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 2.95 2.68 2.95-.03.05-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.42-2.95 1.32.15-1.21.73-2.42 1.05-3.01z"/>
                </svg>
                Continue with Apple
              </button>
            </div>
          )}
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-white/70">{footer}</div>
    </div>
  );
}

export default AuthForm;
