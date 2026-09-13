import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "@/components/auth/AuthRoutes";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { projectAlertsPath } from "@/lib/paths";
import { AlertsPage } from "@/pages/AlertsPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DataEntryPage } from "@/pages/DataEntryPage";
import { DataExplorerPage } from "@/pages/DataExplorerPage";
import { DigitalTwinPage } from "@/pages/DigitalTwinPage";
import { EventsPage } from "@/pages/EventsPage";
import { ForecastDashboardPage } from "@/pages/ForecastDashboardPage";
import { KpiDashboardPage } from "@/pages/KpiDashboardPage";
import { PerformanceDashboardPage } from "@/pages/PerformanceDashboardPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { ProductPage } from "@/pages/ProductPage";
import { ProjectDashboardPage } from "@/pages/ProjectDashboardPage";
import { RuleEnginePage } from "@/pages/RuleEnginePage";
import { SitemapPage } from "@/pages/SitemapPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ScadaPage } from "@/pages/ScadaPage";
import { SectionPage } from "@/pages/SectionPage";
import { SitesPage } from "@/pages/SitesPage";
import { UsersPage } from "@/pages/UsersPage";
import { TeamPage } from "@/pages/TeamPage";
import { AssignedSitesPage } from "@/pages/AssignedSitesPage";
import { MapPage } from "@/pages/MapPage";

function MonitoringToAlertsRedirect() {
  const { projectId } = useParams();
  if (!projectId) return <Navigate to="/" replace />;
  return <Navigate to={projectAlertsPath(projectId)} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
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
                <Route path="/projects/new" element={<Navigate to="/projects" replace />} />
                <Route
                  path="/projects/:projectId"
                  element={<ProjectDashboardPage />}
                />
                <Route
                  path="/projects/:projectId/kpi"
                  element={<KpiDashboardPage />}
                />
                <Route
                  path="/projects/:projectId/performance"
                  element={<PerformanceDashboardPage />}
                />
                <Route
                  path="/projects/:projectId/data-entry"
                  element={<DataEntryPage />}
                />
                <Route
                  path="/projects/:projectId/portfolio"
                  element={<PortfolioPage />}
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
                  path="/projects/:projectId/cmms"
                  element={<ProductPage productId="cmms" />}
                />
                <Route
                  path="/projects/:projectId/ems"
                  element={<ProductPage productId="ems" />}
                />
                <Route
                  path="/projects/:projectId/rule-engine"
                  element={<RuleEnginePage />}
                />
                <Route
                  path="/projects/:projectId/data-explorer"
                  element={<DataExplorerPage />}
                />
                <Route
                  path="/projects/:projectId/asset-twin"
                  element={<ProductPage productId="dt-assets" />}
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
                  path="/projects/:projectId/alerts"
                  element={<AlertsPage />}
                />
                <Route
                  path="/projects/:projectId/events"
                  element={<EventsPage />}
                />
                <Route
                  path="/projects/:projectId/monitoring"
                  element={<MonitoringToAlertsRedirect />}
                />
                <Route
                  path="/projects/:projectId/forecasting"
                  element={<ForecastDashboardPage />}
                />
                <Route
                  path="/projects/:projectId/settings"
                  element={
                    <SectionPage
                      title="Settings"
                      description="Plant configuration and access"
                    />
                  }
                />
                <Route path="/sites" element={<SitesPage />} />
                <Route path="/sites/new" element={<Navigate to="/sites" replace />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/assigned-sites" element={<AssignedSitesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
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
    </ThemeProvider>
  );
}
