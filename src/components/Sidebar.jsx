"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: "fa-solid fa-table-cells-large", path: "/dashboard" },
    { name: "Nouvelle Vidange", icon: "fa-truck-moving", path: "/dashboard/vidange" },
    { name: "Mes Activités", icon: "fa-clock-rotate-left", path: "/dashboard/activites" },
    { name: "Abonnement", icon: "fa-credit-card", path: "/dashboard/abonnement" },
    { name: "Récompenses", icon: "fa-trophy", path: "/dashboard/recompenses" },
    { name: "Carte Live", icon: "fa-map-location-dot", path: "/dashboard/carte" },
    { name: "Impact Écolo", icon: "fa-seedling", path: "/dashboard/impact" },
    { name: "Calendrier", icon: "fa-calendar-days", path: "/dashboard/calendrier" },
    { name: "Support Admin", icon: "fa-headset", path: "/dashboard/support" },
    { name: "Profil", icon: "fa-user-gear", path: "/dashboard/profil" },
  ];

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#6200ee] text-white p-4 flex justify-between items-center z-[60] shadow-md">
        <div className="flex items-center gap-2 font-black italic">
          <i className="fa-solid fa-leaf text-[#ffcc00]"></i> EcoTrack
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10"
        >
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars-staggered'} text-xl`}></i>
        </button>
      </div>

      {/* OVERLAY (Fond sombre quand le menu est ouvert) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* SIDEBAR / DRAWER */}
      <aside className={`
        fixed left-0 top-0 h-full bg-[#6200ee] text-white z-[55] transition-all duration-300 ease-in-out
        lg:w-64 lg:translate-x-0
        ${isOpen ? "w-72 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex h-full flex-col py-6">
          <div className="mb-10 hidden lg:flex px-6 items-center gap-2 text-2xl font-black italic">
            <i className="fa-solid fa-leaf text-[#ffcc00]"></i> EcoTrack
          </div>

          <nav className="flex-1 space-y-1 px-3 overflow-y-auto pt-20 lg:pt-0">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-bold transition-all ${
                    isActive ? "bg-white text-[#6200ee] shadow-xl" : "hover:bg-white/10"
                  }`}
                >
                  <i className={`fa-solid ${item.icon} w-6 text-center text-lg`}></i>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV + BOUTON (+) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-[60]">
        <Link href="/dashboard" className="flex flex-col items-center text-[#6200ee]">
          <i className="fa-solid fa-grid-2 text-xl"></i>
          <span className="text-[10px] font-bold mt-1">Home</span>
        </Link>
        <Link href="/dashboard/vidange" className="flex flex-col items-center text-gray-400">
          <i className="fa-solid fa-truck-moving text-xl"></i>
          <span className="text-[10px] font-bold mt-1">Vidange</span>
        </Link>
        
        {/* BOUTON (+) AVEC MENU DYNAMIQUE */}
        <div className="relative">
          {showAddMenu && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-2 w-48 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <button className="w-full text-left p-3 text-xs font-bold hover:bg-gray-50 rounded-xl flex items-center gap-2">
                <i className="fa-solid fa-plus text-[#6200ee]"></i> Nouvelle Collecte
              </button>
              <button className="w-full text-left p-3 text-xs font-bold hover:bg-gray-50 rounded-xl flex items-center gap-2">
                <i className="fa-solid fa-qrcode text-[#6200ee]"></i> Scanner un Badge
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`h-14 w-14 rounded-full flex items-center justify-center text-white -mt-12 shadow-lg border-4 border-[#f8f9fa] transition-transform active:scale-90 ${showAddMenu ? 'bg-black rotate-45' : 'bg-[#6200ee]'}`}
          >
            <i className="fa-solid fa-plus text-2xl"></i>
          </button>
        </div>

        <Link href="/dashboard/carte" className="flex flex-col items-center text-gray-400">
          <i className="fa-solid fa-map-location-dot text-xl"></i>
          <span className="text-[10px] font-bold mt-1">Carte</span>
        </Link>
        <Link href="/dashboard/profil" className="flex flex-col items-center text-gray-400">
          <i className="fa-solid fa-user text-xl"></i>
          <span className="text-[10px] font-bold mt-1">Profil</span>
        </Link>
      </div>
    </>
  );
}