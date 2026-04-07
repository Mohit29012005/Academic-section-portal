import { Link } from "react-router-dom";
import Logo from "./Logo";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--gu-cream)] text-[var(--gu-text)]">
      {/* Header */}
      <header className="bg-[var(--gu-red)] text-white border-b-2 border-[var(--gu-gold)]">
        <div className="max-w-7xl mx-auto px-6 py-4 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
          </div>

          <nav className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm font-medium">
            <Link
              to="/"
              className="text-white/80 hover:text-white hover:underline decoration-[var(--gu-gold)] decoration-2 underline-offset-4 transition-all duration-200 uppercase tracking-widest whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-white/80 hover:text-white hover:underline decoration-[var(--gu-gold)] decoration-2 underline-offset-4 transition-all duration-200 uppercase tracking-widest whitespace-nowrap"
            >
              About
            </Link>
            <Link
              to="/academics"
              className="text-white/80 hover:text-white hover:underline decoration-[var(--gu-gold)] decoration-2 underline-offset-4 transition-all duration-200 uppercase tracking-widest whitespace-nowrap"
            >
              Academics
            </Link>
            <Link
              to="/login"
              className="text-white/80 hover:text-white hover:underline decoration-[var(--gu-gold)] decoration-2 underline-offset-4 transition-all duration-200 uppercase tracking-widest whitespace-nowrap"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="bg-[var(--gu-red-dark)] py-6 border-t border-[rgba(212,175,55,0.3)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="opacity-80">
            <Logo size="md" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
            <a
              href="#"
              className="hover:text-[var(--gu-gold)] transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-[var(--gu-gold)] transition-colors whitespace-nowrap"
            >
              Contact
            </a>
            <a
              href="#"
              className="hover:text-[var(--gu-gold)] transition-colors whitespace-nowrap"
            >
              Help Desk
            </a>
          </div>
          <p className="font-serif text-sm tracking-wide text-white/60">
            &copy; 2025 Ganpat University. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
