// src/components/SessionProvider.jsx
// NextAuth a besoin d'un "Provider" qui enveloppe toute l'app
// pour que la session soit accessible partout
// On crée ce composant séparé car il nécessite "use client"

"use client";

import { SessionProvider } from "next-auth/react";

// On re-exporte SessionProvider de NextAuth
// pour pouvoir l'utiliser dans le layout (qui est server component)
export default function NextAuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}