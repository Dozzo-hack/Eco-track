"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, Loader2, ShieldAlert } from "lucide-react";

export default function SupportPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]); // Initialisé à un tableau vide
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(true);
  const chatEndRef = useRef(null);

  // Charger les messages réels de l'utilisateur connecté
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const loadMessages = async () => {
        try {
          const res = await fetch("/api/user/chat");
          const result = await res.json();
          
          if (res.ok && result.success) {
            // CORRECTION ICI : On cible 'messages' et on ajoute un repli '[]' par sécurité
            setMessages(result.messages || result.data || []);
          }
        } catch (err) {
          console.error("Erreur historique chat:", err);
          setMessages([]); // Sécurité anti-crash
        } finally {
          setLoadingChat(false);
        }
      };
      loadMessages();
    }
  }, [status, session]);

  // Scroll automatique au dernier message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");

    // Optimistic UI : Ajout visuel instantané à l'écran
    const tempMessage = {
      _id: Date.now().toString(),
      text: currentInput,
      sender: "user",
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch("/api/user/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentInput })
      });
      
      const result = await res.json();
      
      // Si l'API renvoie le message enregistré avec son vrai ID MongoDB, on met à jour la liste
      if (res.ok && result.success && result.data) {
        setMessages((prev) => 
          prev.map((msg) => msg._id === tempMessage._id ? result.data : msg)
        );
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  // ── GESTION DES ÉTATS DE SÉCURITÉ DE LA SESSION ──
  if (status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 gap-2">
        <Loader2 className="animate-spin text-[#6200ee]" size={28} />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Vérification de session...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "user") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-black text-gray-900 uppercase">Accès Refusé</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">Vous devez posséder un compte client valide pour accéder au support de l'administration.</p>
      </div>
    );
  }

  // CORRECTION SÉCURITÉ : On s'assure que 'messages' est bien traité comme un tableau quoi qu'il arrive
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="pt-24 lg:pt-0 pb-24 h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Support Admin</h1>
        <p className="text-gray-500 font-bold">Ravi de vous revoir, <span className="text-[#6200ee]">{session?.user?.prenom || "Client"}</span>. Posez votre question ici.</p>
      </div>

      <div className="flex-1 bg-white rounded-[45px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Panneau d'affichage des Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loadingChat ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="animate-spin text-[#6200ee]" size={20} />
            </div>
          ) : safeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-xs">
              Aucun message. Écrivez ci-dessous pour ouvrir une discussion avec un administrateur.
            </div>
          ) : (
            safeMessages.map((msg) => (
              <div key={msg._id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-5 rounded-[28px] shadow-sm ${
                  msg.sender === "user" 
                    ? "bg-[#6200ee] text-white rounded-tr-none" 
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}>
                  <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                  <p className={`text-[9px] mt-2 font-black uppercase opacity-50 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Maintenant"}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Formulaire d'envoi */}
        <form onSubmit={sendMessage} className="p-6 border-t border-gray-50 bg-gray-50/50">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              className="w-full bg-white border-none rounded-2xl py-4 pl-6 pr-16 font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-[#6200ee]/10"
            />
            <button type="submit" className="absolute right-2 h-12 w-12 bg-[#6200ee] text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}