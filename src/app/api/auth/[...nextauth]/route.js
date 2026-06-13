// src/app/api/auth/[...nextauth]/route.js
// Coeur du système d'authentification NextAuth
// Gère les 3 types de connexion : user, admin, videur

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Videur from "@/models/Videur";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { seedVideurs } from "@/lib/seedVideur";
import { seedAdmin } from "@/lib/seedAdmin";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},

      async authorize(credentials) {
        try {
          await connectDB();
          await seedAdmin();
          await seedVideurs(); // <-- Graine initiale automatique
          
          const { type, email, password, identifiant, idChauffeur, codePin } = credentials;

          // ── CAS 1 : Utilisateur normal ──
          if (type === "user") {
            const user = await User.findOne({ email });
            if (!user) return null;
            const ok = await bcrypt.compare(password, user.password);
            if (!ok) return null;
            return {
              id: user._id.toString(),
              nom: user.nom,
              prenom: user.prenom,
              email: user.email,
              quartier: user.quartier,
              role: "user",
            };
          }

          // ── CAS 2 : Admin ──
          if (type === "admin") {
            const admin = await Admin.findOne({
              identifiant: identifiant.toUpperCase(),
            });
            if (!admin) return null;
            const ok = await bcrypt.compare(password, admin.password);
            if (!ok) return null;
            return {
              id: admin._id.toString(),
              nom: admin.nom,
              identifiant: admin.identifiant,
              role: "admin",
            };
          }

          // ── CAS 3 : Videur ──
          if (type === "videur") {
            const videur = await Videur.findOne({
              idChauffeur: idChauffeur.toUpperCase(),
            });
            if (!videur) return null;
            if (!videur.actif) return null;
            const ok = await bcrypt.compare(codePin, videur.codePin);
            if (!ok) return null;
            return {
              id: videur._id.toString(),
              nom: videur.nom,
              idChauffeur: videur.idChauffeur,
              zone: videur.zone,
              role: "videur",
            };
          }

          return null;
        } catch (error) {
          console.error("Erreur authorize:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nom = user.nom;
        token.role = user.role;
        token.identifiant = user.identifiant;
        token.idChauffeur = user.idChauffeur;
        token.zone = user.zone;
        token.quartier = user.quartier;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.nom = token.nom;
        session.user.role = token.role;
        session.user.identifiant = token.identifiant;
        session.user.idChauffeur = token.idChauffeur;
        session.user.zone = token.zone;
        session.user.quartier = token.quartier;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  pages: {},
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };