import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export function CreateOrgModal({ onClose }: { onClose?: () => void }) {
  const { createOrg } = useAuthStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createOrg(name, slug);
      onClose?.();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-[var(--color-surface)] p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Create Organization</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          You need to create an organization to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === generateSlug(name)) {
                  setSlug(generateSlug(e.target.value));
                }
              }}
              placeholder="My Company"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Slug (URL-friendly identifier)
            </label>
            <Input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="my-company"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Organization"}
          </Button>
        </form>
      </div>
    </div>
  );
}
