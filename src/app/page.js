"use client";
import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, User, ArrowRight, Recycle, MapPin, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 p-6 md:p-12">
      
      {/* HEADER / LOGO */}
      <nav className="mb-16 flex items-center gap-2">
        <div className="bg-orange-500 p-2 rounded-xl text-white">
          <Recycle size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter">ECOTRACK</h1>
      </nav>

      {/* SECTION INTRO */}
      <section className="mb-20 max-w-2xl">
        <span className="text-orange-500 font-bold text-[10px] uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full">
          Gestion intelligente des déchets
        </span>
        <h2 className="text-5xl md:text-6xl font-black mt-4 leading-tight">
          Votre ville, <br/>
          <span className="text-orange-500">plus propre</span>, plus vite.
        </h2>
        <p className="mt-6 text-slate-500 text-lg leading-relaxed">
          EcoTrack est la solution digitale qui connecte les ménages, les collecteurs et les centres de tri. 
          Suivi en temps réel, optimisation des tournées et valorisation de vos déchets au quotidien.
        </p>
      </section>

      {/* PORTAIL D'ACCÈS (CARDS) */}
      <section className="mb-20">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Accéder à votre espace</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD UTILISATEUR */}
          <Link href="/auth/user/login?role=user" className="group block bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <User size={24} />
            </div>
            <h4 className="text-xl font-black mb-2">Citoyen</h4>
            <p className="text-slate-500 text-sm mb-6">Suivez vos collectes, consultez vos points et participez au tri.</p>
            <span className="inline-flex items-center gap-2 text-purple-500 font-bold text-sm group-hover:gap-4 transition-all">
              Se connecter <ArrowRight size={16} />
            </span>
          </Link>

          {/* CARD VIDEUR / CHAUFFEUR */}
          <Link href="auth/truck" className="group block bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
              <Truck size={24} />
            </div>
            <h4 className="text-xl font-black mb-2">Collecteur</h4>
            <p className="text-slate-500 text-sm mb-6">Optimisez vos tournées de ramassage et gérez vos flux en temps réel.</p>
            <span className="inline-flex items-center gap-2 text-orange-600 font-bold text-sm group-hover:gap-4 transition-all">
              Accès Chauffeur <ArrowRight size={16} />
            </span>
          </Link>

          {/* CARD ADMIN */}
          <Link href="auth/admin" className="group block bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-xl font-black mb-2">Administrateur</h4>
            <p className="text-slate-500 text-sm mb-6">Superviser la flotte, analyser les finances et gérer les zones.</p>
            <span className="inline-flex items-center gap-2 text-green-600 font-bold text-sm group-hover:gap-4 transition-all">
              Console Admin <ArrowRight size={16} />
            </span>
          </Link>

        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="border-t border-slate-200 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-bold gap-4">
        <p>© 2026 EcoTrack Pro - Tous droits réservés</p>
        <div className="flex gap-6">
          <span>Conditions d'utilisation</span>
          <span>Support</span>
        </div>
      </footer>

    </main>
  );
}