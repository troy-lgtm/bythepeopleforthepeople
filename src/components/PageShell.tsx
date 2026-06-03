import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { InstallPrompt } from "./InstallPrompt";

type PageShellProps = {
  children: React.ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-paper-50 text-ink-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      {/* Spacer so the fixed bottom nav never covers footer content on mobile */}
      <div
        aria-hidden="true"
        className="md:hidden"
        style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }}
      />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
