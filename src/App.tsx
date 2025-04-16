import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/LoginPage";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { BookingPage } from "./pages/BookingPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { LandingPage } from "./pages/LandingPage";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";

// Protected route component for user routes
const ProtectedUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Protected route component for admin routes
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Wrapped app component with AuthProvider
const AppWithAuth = () => {
  // Create router
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <LandingPage />,
        },
        {
          path: "/login",
          element: <LoginPage />,
        },
        // User routes
        {
          path: "/dashboard",
          element: (
            <ProtectedUserRoute>
              <UserDashboard />
            </ProtectedUserRoute>
          ),
        },
        {
          path: "/book",
          element: (
            <ProtectedUserRoute>
              <BookingPage />
            </ProtectedUserRoute>
          ),
        },
        {
          path: "/my-bookings",
          element: (
            <ProtectedUserRoute>
              <MyBookingsPage />
            </ProtectedUserRoute>
          ),
        },
        // Admin routes
        {
          path: "/admin/dashboard",
          element: (
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          ),
        },
        {
          path: "/admin/logs",
          element: (
            <ProtectedAdminRoute>
              <AuditLogsPage />
            </ProtectedAdminRoute>
          ),
        },
        {
          path: "/admin/analytics",
          element: (
            <ProtectedAdminRoute>
              <AnalyticsDashboard />
            </ProtectedAdminRoute>
          ),
        },
        {
          path: "*",
          element: <Navigate to="/" />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

// App component to provide auth context
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}
