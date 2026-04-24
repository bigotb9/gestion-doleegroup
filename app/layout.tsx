import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Syne } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "next-auth/react"
import NextTopLoader from "nextjs-toploader"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Dolee Group | Gestion commerciale",
  description: "Plateforme de gestion commerciale Dolee Group",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`h-full ${plusJakarta.variable} ${syne.variable}`}>
      <body className="h-full antialiased font-sans">
        <NextTopLoader color="#D4AF37" shadow="0 0 10px #D4AF37,0 0 5px #D4AF37" height={3} showSpinner={false} />
        <SessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  )
}
