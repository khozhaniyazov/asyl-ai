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
import WaitlistView from "./components/WaitlistView";
// v3: marketplace
import MarketplaceSearch from "./components/MarketplaceSearch";
import TherapistPublicProfile from "./components/TherapistPublicProfile";
import MarketplaceProfile from "./components/MarketplaceProfile";
import IncomingBookings from "./components/IncomingBookings";
// B+C: new features
import MessagesView from "./components/MessagesView";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ClinicManagement from "./components/ClinicManagement";
import PayoutDashboard from "./components/PayoutDashboard";
import AdminDashboard from "./components/AdminDashboard";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  { path: "/onboarding", Component: OnboardingWizard },
  { path: "/parent/login", Component: ParentLogin },
  { path: "/parent", Component: ParentPortal },
  // v3: public marketplace pages
  { path: "/marketplace", Component: MarketplaceSearch },
  { path: "/marketplace/:therapistId", Component: TherapistPublicProfile },
  {
    path: "/",
    Component: TherapistLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "patients", Component: Patients },
      { path: "patients/:id", Component: PatientProfile },
      { path: "session/:appointmentId", Component: ActiveSession },
      { path: "finance", Component: Finance },
      { path: "homework", Component: HomeworkLibrary },
      { path: "waitlist", Component: WaitlistView },
      // v3: marketplace management
      { path: "profile", Component: MarketplaceProfile },
      { path: "bookings", Component: IncomingBookings },
      // B+C: new features
      { path: "messages", Component: MessagesView },
      { path: "analytics", Component: AnalyticsDashboard },
      { path: "clinic", Component: ClinicManagement },
      { path: "settings", Component: Settings },
      // Payouts & Admin
      { path: "payouts", Component: PayoutDashboard },
      { path: "admin", Component: AdminDashboard },
    ],
  },
]);
