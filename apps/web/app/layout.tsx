import type { Metadata } from "next";
import "./globals.css";
import I18nProvider from "@/components/I18nProvider";

export const metadata: Metadata = {
  title: "Otantist",
  description: "Emotionally safe social platform for autistic individuals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
