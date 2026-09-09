import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "@/components/auth/AuthRoutes";
import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { AuthPage } from "@/pages/AuthPage";
import { CreateProjectPage } from "@/pages/CreateProjectPage";
import { CreateSitePage } from "@/pages/CreateSitePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DigitalTwinPage } from "@/pages/DigitalTwinPage";
import { ProjectDashboardPage } from "@/pages/ProjectDashboardPage";
import { SitemapPage } from "@/pages/SitemapPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ScadaPage } from "@/pages/ScadaPage";
import { SectionPage } from "@/pages/SectionPage";
import { SitesPage } from "@/pages/SitesPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/signin" element={<AuthPage mode="signin" />} />
              <Route
                path="/request-access"
                element={<AuthPage mode="request" />}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<CreateProjectPage />} />
              <Route
                path="/projects/:projectId"
                element={<ProjectDashboardPage />}
              />
              <Route
                path="/projects/:projectId/digital-twin"
                element={<DigitalTwinPage />}
              />
              <Route
                path="/projects/:projectId/sitemap"
                element={<SitemapPage />}
              />
              <Route
                path="/projects/:projectId/scada"
                element={<ScadaPage />}
              />
              <Route
                path="/projects/:projectId/analytics"
                element={
                  <SectionPage
                    title="Analytics"
                    description="Performance, losses, and plant insights"
                  />
                }
              />
              <Route
                path="/projects/:projectId/monitoring"
                element={
                  <SectionPage
                    title="Monitoring"
                    description="Health, alarms, and asset status"
                  />
                }
              />
              <Route
                path="/projects/:projectId/forecasting"
                element={
                  <SectionPage
                    title="Forecasting"
                    description="Generation forecast and weather outlook"
                  />
                }
              />
              <Route
                path="/projects/:projectId/settings"
                element={
                  <SectionPage
                    title="Settings"
                    description="Project configuration and access"
                  />
                }
              />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/sites/new" element={<CreateSitePage />} />
              <Route
                path="/alerts"
                element={
                  <SectionPage
                    title="Alerts"
                    description="Operational alerts across this site"
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <SectionPage
                    title="Reports"
                    description="Site-level reports and exports"
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <SectionPage
                    title="Settings"
                    description="Site and organisation settings"
                  />
                }
              />
              <Route path="/digital-twins" element={<Navigate to="/" replace />} />
              <Route
                path="/digital-twins/:plantId"
                element={<Navigate to="/" replace />}
              />
              <Route path="/analytics" element={<Navigate to="/" replace />} />
              <Route path="/simulation" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
