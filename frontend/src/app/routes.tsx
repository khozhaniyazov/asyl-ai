import { createBrowserRouter } from "react-router";
import TherapistLayout from "./components/TherapistLayout";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import PatientProfile from "./components/PatientProfile";
import ActiveSession from "./components/ActiveSession";
import Finance from "./components/Finance";
import Settings from "./components/Settings";
import Login from "./components/Login";
import Register from "./components/Register";
import ParentLogin from "./components/ParentLogin";
import ParentPortal from "./components/ParentPortal";
import OnboardingWizard from "./components/OnboardingWizard";
import HomeworkLibrary from "./components/HomeworkLibrary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ParentProtectedRoute } from "./components/ParentProtectedRoute";

// Phase 2 imports (hidden for MVP)
// import WaitlistView from "./components/WaitlistView";
// import MarketplaceSearch from "./components/MarketplaceSearch";
// import TherapistPublicProfile from "./components/TherapistPublicProfile";
// import MarketplaceProfile from "./components/MarketplaceProfile";
// import IncomingBookings from "./components/IncomingBookings";
// import MessagesView from "./components/MessagesView";
// import AnalyticsDashboard from "./components/AnalyticsDashboard";
// import ClinicManagement from "./components/ClinicManagement";
// import PayoutDashboard from "./components/PayoutDashboard";
// import AdminDashboard from "./components/AdminDashboard";
// import AdminVerification from "./components/AdminVerification";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ),
  },
  { path: "/parent/login", Component: ParentLogin },
  {
    path: "/parent",
    element: (
      <ParentProtectedRoute>
        <ParentPortal />
      </ParentProtectedRoute>
    ),
  },
  {
    path: "/parent/portal",
    element: (
      <ParentProtectedRoute>
        <ParentPortal />
      </ParentProtectedRoute>
    ),
  },
  {
    path: "/",
    Component: TherapistLayout, // TherapistLayout has built-in auth check
    children: [
      { index: true, Component: Dashboard },
      { path: "patients", Component: Patients },
      { path: "patients/:id", Component: PatientProfile },
      { path: "session/:appointmentId", Component: ActiveSession },
      { path: "finance", Component: Finance },
      { path: "homework", Component: HomeworkLibrary },
      { path: "settings", Component: Settings },
      // Phase 2 routes (hidden for MVP)
      // { path: "waitlist", Component: WaitlistView },
      // { path: "profile", Component: MarketplaceProfile },
      // { path: "bookings", Component: IncomingBookings },
      // { path: "messages", Component: MessagesView },
      // { path: "analytics", Component: AnalyticsDashboard },
      // { path: "clinic", Component: ClinicManagement },
      // { path: "payouts", Component: PayoutDashboard },
      // { path: "admin", Component: AdminDashboard },
      // { path: "admin/verification", Component: AdminVerification },
    ],
  },
]);
