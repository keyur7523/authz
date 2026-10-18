import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loginWithOAuth } = useAuthStore();
  const [failure, setFailure] = useState("");
  // The OAuth state is single-use, so StrictMode's second effect run must not resend it
  const started = useRef(false);

  const provider = params.get("provider");
  const code = params.get("code");
  const state = params.get("state");
  const valid =
    !params.get("error") && !!code && !!state && (provider === "google" || provider === "github");

  useEffect(() => {
    if (!valid || started.current) return;
    started.current = true;

    loginWithOAuth(provider as "google" | "github", code!, state!)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err: { message?: string }) => setFailure(err.message || "Sign-in failed"));
  }, [valid, provider, code, state, loginWithOAuth, navigate]);

  const error = valid ? failure : "Sign-in was cancelled or the link is invalid.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8 space-y-4 text-center">
        {error ? (
          <>
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</div>
            <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Back to sign in
            </Link>
          </>
        ) : (
          <div className="text-zinc-400">Signing you in...</div>
        )}
      </div>
    </div>
  );
}
