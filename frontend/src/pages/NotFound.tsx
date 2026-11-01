import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="p-6">
      <div className="font-display text-3xl font-semibold">Page not found</div>
      <Link to="/dashboard" className="mt-2 inline-block text-sm text-[var(--color-accent)] underline">
        Go to dashboard
      </Link>
    </div>
  );
}
