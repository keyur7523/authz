import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { Roles } from "./pages/Roles";
import { RoleDetail } from "./pages/RoleDetail";
import { Permissions } from "./pages/Permissions";
import { Requests } from "./pages/Requests";
import { Audit } from "./pages/Audit";
import { Users } from "./pages/Users";
import { Login } from "./pages/Login";
import { useAuthStore } from "./stores/authStore";
import { CreateOrgModal } from "./components/CreateOrgModal";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, currentOrgId } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show create org modal if user has no organizations
  if (user && user.organizations.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <CreateOrgModal />
      </div>
    );
  }

  // Show create org modal if no org is selected
  if (user && !currentOrgId) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <CreateOrgModal />
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/roles/:roleId" element={<RoleDetail />} />
        <Route path="/admin/permissions" element={<Permissions />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/requests" element={<Requests />} />
        <Route path="/admin/audit" element={<Audit />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
