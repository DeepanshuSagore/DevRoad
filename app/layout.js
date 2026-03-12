import "./globals.css";
import Navbar from "@/components/Sidebar";

export const metadata = {
  title: "DevRoad — Developer Learning Tracker",
  description:
    "Track your learning roadmaps, study time, and daily streak. Built for developers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <Navbar />
        <main className="min-h-screen pt-14">
          <div className="max-w-6xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
