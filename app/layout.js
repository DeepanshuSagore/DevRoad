import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "DevRoad — Developer Learning Tracker",
  description:
    "Track your learning roadmaps, study time, and daily streak. Built for developers.",
};

export default function RootLayout({ children }) {
  return (
    // 'dark' class forces permanent dark mode across all Tailwind dark: utilities
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Fixed sidebar — 240px wide */}
          <Sidebar />

          {/* Main content — offset by sidebar width */}
          <main className="flex-1 ml-60 overflow-y-auto">
            <div className="min-h-screen p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
