import React, { useState } from "react";
import { Lock, Mail, User, Building, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { signInUser, signUpUser } from "../../lib/supabase";

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string) => void;
  onContinueAsGuest: () => void;
}

export const MetricLoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("MetricAccounting Nursery");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        // Supabase Auth Sign Up
        await signUpUser(email, password, {
          data: { org_name: orgName },
        });
        setSuccessMsg("Account created successfully! Logging you in...");
        setTimeout(async () => {
          try {
            await signInUser(email, password);
            onLoginSuccess(email);
          } catch {
            onLoginSuccess(email);
          }
        }, 1000);
      } else {
        // Supabase Auth Sign In
        await signInUser(email, password);
        setSuccessMsg("Logged in successfully!");
        onLoginSuccess(email);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        {/* Top Header */}
        <div className="bg-[#00a651] p-8 text-white text-center space-y-2">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">MetricAccounting</h1>
          <p className="text-xs text-emerald-100 font-medium">
            Agricultural Nursery Management SaaS
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-3 text-center transition ${
              !isSignUp
                ? "bg-white text-[#00a651] border-b-2 border-[#00a651] font-extrabold"
                : "hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-3 text-center transition ${
              isSignUp
                ? "bg-white text-[#00a651] border-b-2 border-[#00a651] font-extrabold"
                : "hover:text-slate-700"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nursery / Organization Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                  placeholder="Greenza Solutions"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                placeholder="admin@metricaccounting.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#00a651] text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Processing..." : isSignUp ? "Register Account" : "Sign In to MetricAccounting"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Guest Demo Access Option */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold underline"
            >
              Continue in Local Offline Demo Mode →
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          Secured with Supabase Auth & PostgreSQL Row Level Security
        </div>
      </div>
    </div>
  );
};
