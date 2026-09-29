import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { tokenKey } from "./lib/api";
import { AuditPage } from "./pages/AuditPage";
import { CopyrightPage } from "./pages/CopyrightPage";
import { DashboardPage } from "./pages/DashboardPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { LoginPage } from "./pages/LoginPage";
import { OperationsPage } from "./pages/OperationsPage";
import { ResourcePage } from "./pages/ResourcePage";
import { RolesPage } from "./pages/RolesPage";
export default function App() {
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem(tokenKey)),
  );
  useEffect(() => {
    const expire = () => setAuthenticated(false);
    window.addEventListener("admin-session-expired", expire);
    return () => window.removeEventListener("admin-session-expired", expire);
  }, []);
  if (!authenticated) return <LoginPage done={() => setAuthenticated(true)} />;
  const logout = () => {
    localStorage.removeItem(tokenKey);
    setAuthenticated(false);
  };
  return (
    <Routes>
      <Route element={<AdminLayout logout={logout} />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<ResourcePage resource="users" />} />
        <Route path="groups" element={<ResourcePage resource="groups" />} />
        <Route path="posts" element={<ResourcePage resource="posts" />} />
        <Route path="reports" element={<ResourcePage resource="reports" />} />
        <Route path="copyright" element={<CopyrightPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
