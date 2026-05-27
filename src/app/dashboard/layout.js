import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Sidebar - Fixe sur desktop, cachée ou mini sur mobile */}
      <Sidebar />
      
      {/* Zone de contenu principale */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}