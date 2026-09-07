import { Outlet } from "react-router-dom";
import MemberTopNav from "../components/MemberTopNav";
import MemberBottomNav from "../components/MemberBottomNav";

export default function MemberLayout() {
  return (
    <div className="min-h-screen bg-gym-dark text-white font-sans overflow-x-hidden selection:bg-gym-primary selection:text-black">
      <MemberTopNav />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <Outlet />
      </main>
      <MemberBottomNav />
    </div>
  );
}
