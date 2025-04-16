import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Toaster } from "sonner";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
