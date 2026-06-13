"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from "next-auth/react"; // 1. Importation des outils d'auth
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  CalendarDays, 
  CreditCard, 
  LogOut,
  ShieldAlert,
  Home,
  HelpCircle
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession(); // 2. Récupération de la session

  const menuItems = [
    { name: 'Vue d’ensemble', path: '/admin', icon: LayoutDashboard },
    { name: 'Utilisateurs', path: '/admin/users', icon: Users },
    { name: 'Flotte & Videurs', path: '/admin/fleet', icon: Truck },
    { name: 'Planning Vidange', path: '/admin/schedule', icon: CalendarDays },
    { name: 'Quizz', path: '/admin/quizz', icon: HelpCircle },
    { name: 'Quartiers', path: '/admin/quartiers', icon: Home },
    { name: 'Paiements & Tarifs', path: '/admin/finance', icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR GAUCHE - FIXE */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-green-500 p-2 rounded-xl">
              <ShieldAlert size={24} className="text-black" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">ECO <span className="text-green-500 underline">ADMIN</span></h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all no-underline ${
                    isActive 
                    ? 'bg-green-500 text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm uppercase tracking-widest text-[11px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* PROFIL ADMIN DYNAMIQUE */}
        <div className="mt-auto p-6 border-t border-zinc-900">
          <div className="flex items-center gap-3 mb-6 p-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-green-500">
              {/* Initiale du nom dynamique */}
              {session?.user?.nom ? session.user.nom.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <p className="text-xs font-black uppercase">
                {session?.user?.nom || "Chargement..."}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                {/* ID dynamique (on prend les 4 derniers caractères) */}
                ID: #{session?.user?.id ? session.user.id.slice(-4) : "0000"}
              </p>
            </div>
          </div>
          
          {/* Bouton Quitter fonctionnel */}
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/admin" })}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-xs"
          >
            <LogOut size={16} /> QUITTER
          </button>
        </div>
      </aside>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <main className="flex-1 bg-black overflow-y-auto">
        <div className="h-20 border-b border-zinc-900 flex items-center justify-end px-10 gap-6">
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Serveur Douala : OK</span>
           </div>
        </div>
        
        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
}