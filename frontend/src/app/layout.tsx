import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "../components/providers/ReduxProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "LedgerPulse",
  description: "Smart Financial Ledger",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-canvas p-6">
                {children}
              </main>
            </div>
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
