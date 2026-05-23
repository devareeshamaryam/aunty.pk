import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { GuestProvider } from "./context/GuestContext";
import { SettingsProvider } from "./context/SettingsContext";
import FloatingCartBar from "./components/Floatingcartbar";
import SilentLocationCapture from "./components/SilentLocationCapture";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Aunty.pk - Premium Pakistani Homemade Food",
  description: "Fresh homemade biryani, shami kabab & delicious meals in Multan. Fast delivery, hygienic ingredients, authentic taste.",
  alternates: { canonical: "https://www.aunty.pk" },
};

/** Browser chrome tint (mobile address bar) — matches our cyan brand. */
export const viewport: Viewport = {
  themeColor: '#0891b2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased font-sans bg-white`}
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        <AuthProvider>
          <SettingsProvider>
            <GuestProvider>
              <CartProvider>
                {children}
                {/* Floating cart bar shows on every page when cart has items */}
                <FloatingCartBar />
                {/* Captures GPS once on first load — never shown to the user. */}
                <SilentLocationCapture />
              </CartProvider>
            </GuestProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
