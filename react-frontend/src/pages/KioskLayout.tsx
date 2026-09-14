import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function KioskLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If there is a kiosk specific login, you could skip checking here. 
    // We assume the admin logs in first before putting the device in kiosk mode.
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

  if (isChecking) {
    return <div className="flex h-screen bg-[#111] items-center justify-center text-white">Loading Kiosk...</div>;
  }

  return (
    <div className="flex h-screen bg-[#111] overflow-hidden">
      <main className="flex-1 overflow-y-auto w-full h-full">
        <Outlet />
      </main>
    </div>
  );
}
