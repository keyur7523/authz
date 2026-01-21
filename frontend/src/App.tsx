import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { Roles } from "./pages/Roles";
import { RoleDetail } from "./pages/RoleDetail";
import { Permissions } from "./pages/Permissions";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/roles/:roleId" element={<RoleDetail />} />
        <Route path="/admin/permissions" element={<Permissions />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
