import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { apiFetch } from "../lib/api";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (location.pathname === "/admin/login") {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (!res.ok) {
          navigate("/admin/login");
        }
      } catch (err) {
        navigate("/admin/login");
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [location.pathname, navigate]);

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  if (isChecking) {
    return <div className="flex h-screen bg-[#111] items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[#111] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
