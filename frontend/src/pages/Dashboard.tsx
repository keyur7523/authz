import { Card } from "../components/ui/Card";

export function Dashboard() {
  return (
    <Card>
      <div className="text-sm font-semibold">Dashboard</div>
      <div className="mt-1 text-sm text-[var(--color-text-muted)]">
        Authorization platform overview
      </div>
    </Card>
  );
}
