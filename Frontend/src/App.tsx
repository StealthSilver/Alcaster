import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";

import { DashboardPage } from "@/pages/DashboardPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#010609] px-6 text-center font-[Inter,system-ui,sans-serif] text-white">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#e6740a]">
          Alcaster
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-white/40">
          Coming soon — navigate back to the dashboard to continue.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[#e6740a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#f0821a]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
        <Route
          path="/digital-twins"
          element={<PlaceholderPage title="Digital Twins" />}
        />
        <Route
          path="/digital-twins/:plantId"
          element={<PlaceholderPage title="Digital Twin" />}
        />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="/alerts" element={<PlaceholderPage title="Alerts" />} />
        <Route
          path="/simulation"
          element={<PlaceholderPage title="Simulation" />}
        />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route
          path="/projects/new"
          element={<PlaceholderPage title="Create Plant" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
