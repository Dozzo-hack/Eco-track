"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Navigation, AlertTriangle, History, User } from 'lucide-react';

export default function TruckLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dash', path: '/truck', icon: LayoutDashboard },
    { name: 'Missions', path: '/truck/missions', icon: Truck },
    { name: 'Carte', path: '/truck/map', icon: Navigation },
    { name: 'Alertes', path: '/truck/incidents', icon: AlertTriangle },
    { name: 'Passages', path: '/truck/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-28">
      {/* HEADER UNIQUE & PRO */}
      <header className="bg-orange-500 p-5 pt-8 rounded-b-[40px] shadow-lg text-white sticky top-0 z-[1000]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest leading-tight">Terminal Embarqué v2.0</p>
            <h1 className="text-2xl font-black tracking-tighter">ECO TRACK <span className="text-black italic underline">PRO</span></h1>
          </div>
          
          {/* ICONE PROFIL AVEC PHOTO (Interactive) */}
          <Link href="/truck/profil" className="relative group">
            <div className="w-12 h-12 rounded-2xl border-2 border-white/50 overflow-hidden shadow-lg active:scale-90 transition-transform bg-slate-200">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Patrice" 
                alt="Profil Videur"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-orange-500 animate-pulse"></div>
          </Link>
        </div>
      </header>

      {/* CONTENU SANS HEADER DOUBLÉ */}
      <main className="max-w-md mx-auto pt-4">{children}</main>

      {/* DOCK NAVIGATION */}
      <nav className="fixed bottom-6 left-5 right-5 bg-white/90 backdrop-blur-xl border border-gray-100 h-20 rounded-[30px] shadow-2xl flex justify-around items-center px-2 z-[1000]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center gap-1 no-underline">
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-orange-500 text-white shadow-lg scale-110' : 'text-gray-400'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold uppercase ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}