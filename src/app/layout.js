import "./globals.css";

import NextAuthProvider from "@/components/SessionProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* On garde juste FontAwesome pour les icônes des formulaires */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        {/* SessionProvider rend la session accessible partout dans l'app */}
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}