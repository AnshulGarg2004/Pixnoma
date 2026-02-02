import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import FloatingShapes from "@/components/floating-spaes";
import Header from "@/components/header";
import { shadesOfPurple } from '@clerk/themes'
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from '@clerk/nextjs'
export const metadata: Metadata = {
  title: "PIXNOMA",
  description: "Edit your photos with AI-powered tools.",
};

export default function RootLayout({

  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <ClerkProvider appearance={{
      elements : {
        baseThemes : shadesOfPurple
      }
    }}>
      <html lang="en" suppressHydrationWarning >
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange />
          <ConvexClientProvider>
            <Header />
            <main className="bg-slate-900 min-h-screen text-white overflow-x-hidden">
              <Toaster richColors />
              <FloatingShapes />
              {children}
            </main>
          </ConvexClientProvider>


        </body>
      </html >
    </ClerkProvider>
  );
}
