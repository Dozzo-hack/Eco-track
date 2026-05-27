"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TruckNavigation({ isMenuOpen, setIsMenuOpen }) {
  const pathname = usePathname();

  const primaryNav = [
    { label: "Dashboard", icon: "fa-chart-pie", path: "/truck" },
    { label: "Missions", icon: "fa-list-check", path: "/truck/missions" },
    { label: "Carte", icon: "fa-map-location-dot", path: "/truck/map" },
  ];

  const secondaryNav = [
    { label: "Historique", icon: "fa-clock-rotate-left", path: "/truck/history" },
    { label: "Incidents", icon: "fa-triangle-exclamation", path: "/truck/incidents" },
    { label: "Paramètres", icon: "fa-gears", path: "/truck/settings" },
  ];

  return (
    <>
      {/* --- MOBILE: BOTTOM TAB BAR --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b]/95 backdrop-blur-lg border-t border-slate-700 px-6 py-3 z-50 flex justify-between items-center shadow-2xl">
        {primaryNav.map((item) => (
          <Link key={item.path} href={item.path} className={`flex flex-col items-center gap-1 ${pathname === item.path ? "text-blue-500" : "text-slate-400"}`}>
            <i className={`fa-solid ${item.icon} text-xl`}></i>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
        <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
          <i className="fa-solid fa-bars-staggered text-xl"></i>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Plus</span>
        </button>
      </nav>

      {/* --- MOBILE: OVERLAY MENU (HAMBURGER) --- */}
      <div className={`fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm z-[60] lg:hidden transition-all duration-300 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="flex flex-col h-full p-8">
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-white text-2xl mb-10"><i className="fa-solid fa-xmark"></i></button>
          <div className="space-y-4">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <Link key={item.path} href={item.path} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-2xl font-black text-white italic py-4 border-b border-white/10 uppercase tracking-tighter">
                <i className={`fa-solid ${item.icon} text-blue-500`}></i> {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* --- DESKTOP: SLIM SIDEBAR (HIDDEN ON MOBILE) --- */}
      <aside className="hidden lg:flex flex-col w-20 hover:w-64 bg-[#1e293b] border-r border-slate-800 transition-all duration-300 group z-50 h-screen sticky top-0">
        <div className="p-6">
           <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-truck-fast text-white"></i>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-4 mt-4">
          {[...primaryNav, ...secondaryNav].map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <i className={`fa-solid ${item.icon} text-xl w-6 text-center`}></i>
                <span className="font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity uppercase tracking-tighter text-sm">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-blue-400">
                <i className="fa-solid fa-user-circle text-xl"></i>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="text-xs font-black text-white">M. Bakary</p>
                <p className="text-[10px] font-bold text-green-500">SERVICE</p>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
}