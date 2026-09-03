import MemberBottomNav from "@/components/MemberBottomNav";
import MemberTopNav from "@/components/MemberTopNav";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gym-dark flex flex-col">
      <MemberTopNav />
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      <MemberBottomNav />
    </div>
  );
}
