import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="p-6">
      <div className="text-lg font-semibold">404</div>
      <Link to="/dashboard" className="text-sm underline">
        Go back
      </Link>
    </div>
  );
}
