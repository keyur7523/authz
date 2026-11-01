import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { authApi } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const sampleDecisions = [
  {
    question: "Can Priya deploy to production?",
    reason: "Release managers can deploy",
    result: "Allowed",
    color: "text-[#7fdcc0]",
  },
  {
    question: "Can Sam open billing exports?",
    reason: "Contractors have no finance access",
    result: "Denied",
    color: "text-[#f59a9a]",
  },
  {
    question: "Can Mei rotate the API keys?",
    reason: "Access request sent to security",
    result: "Pending",
    color: "text-[var(--color-rail-accent)]",
  },
];

export function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, name, password);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const { url } = await authApi.oauthUrl("google");
      window.location.href = url;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Google sign-in is unavailable");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[var(--color-bg)] lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-[var(--color-rail)] p-12 lg:flex">
        <div className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--color-rail-text)]">
          <KeyRound className="h-6 w-6 text-[var(--color-rail-accent)]" />
          AuthZ
        </div>

        <div className="max-w-xl">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--color-rail-text)]">
            Know who can do what, and why.
          </h1>
          <ul className="mt-10 divide-y divide-[var(--color-rail-line)] border-y border-[var(--color-rail-line)]">
            {sampleDecisions.map((d) => (
              <li key={d.question} className="flex items-start justify-between gap-6 py-4">
                <div>
                  <div className="text-[var(--color-rail-text)]">{d.question}</div>
                  <div className="mt-1 text-sm text-[var(--color-rail-muted)]">{d.reason}</div>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${d.color}`}>{d.result}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[var(--color-rail-muted)]">Sample decisions</p>
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <div className="mb-8 flex items-center gap-2 font-display text-xl font-semibold lg:hidden">
              <KeyRound className="h-6 w-6 text-[var(--color-accent)]" />
              AuthZ
            </div>
            <h2 className="font-display text-3xl font-semibold">
              {isRegister ? "Create your account" : "Sign in"}
            </h2>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            or use your email
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={isRegister ? 8 : undefined}
              required
            />

            {error && (
              <div className="rounded-lg bg-[var(--color-error-muted)] p-3 text-sm text-[var(--color-error-text)]">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              {isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
          >
            {isRegister ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </main>
    </div>
  );
}
