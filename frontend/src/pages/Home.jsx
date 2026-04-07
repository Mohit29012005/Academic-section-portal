import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { BookOpen, Users, Award } from "lucide-react";

const Home = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section
        className="relative h-[60vh] min-h-[500px] flex items-center justify-center animate-fade-in"
        style={{
          backgroundImage: 'url("/maxresdefault.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.7))",
          }}
        ></div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-4 font-bold tracking-tight">
            Ganpat University
          </h1>
          <h2 className="text-[#D4AF37] uppercase tracking-[0.2em] text-lg md:text-xl font-medium mb-6 flex-wrap">
            Academic section Portal
          </h2>
          <p className="font-serif italic text-white text-lg md:text-xl mb-10 opacity-90 break-words">
            "Empowering Education Through Technology"
          </p>

          <Link
            to="/login"
            className="inline-block bg-[#D4AF37] rounded-2xl text-[#7F1D1D] font-bold uppercase tracking-wider px-8 py-4 min-w-fit whitespace-nowrap shadow-[2px_2px_10px_rgba(0,0,0,0.3)] hover:bg-[#B8960C] transition-colors duration-200"
          >
            Login to Portal
          </Link>
        </div>
      </section>

      {/* About Strip */}
      <section className="bg-[var(--gu-red-dark)] py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white font-medium tracking-widest text-sm uppercase flex flex-wrap justify-center items-center gap-2 md:gap-4">
            <span className="whitespace-nowrap">Established 2005</span>
            <span className="hidden sm:inline text-[var(--gu-gold)]">
              &middot;
            </span>
            <span className="whitespace-nowrap">NAAC Accredited</span>
            <span className="hidden sm:inline text-[var(--gu-gold)]">
              &middot;
            </span>
            <span className="whitespace-nowrap">10,000+ Students</span>
            <span className="hidden sm:inline text-[var(--gu-gold)]">
              &middot;
            </span>
            <span className="whitespace-nowrap">500+ Faculty</span>
          </p>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Academic Programs Card */}
          <div className="bg-white border border-[rgba(185,28,28,0.2)] border-t-[3px] border-t-[var(--gu-red)] p-6 box-border overflow-hidden flex flex-col items-center text-center hover:bg-[rgba(185,28,28,0.03)] hover:shadow-lg transition-all duration-300 rounded-none shadow-sm">
            <BookOpen className="w-6 h-6 flex-shrink-0 text-[var(--gu-red)] mb-4 stroke-[1.5]" />
            <h3 className="font-serif text-xl md:text-2xl text-[var(--gu-red-dark)] font-semibold mb-2">
              Academic Programs
            </h3>
            <p className="text-[var(--gu-text)] opacity-70 text-sm leading-relaxed font-sans">
              Explore our diverse range of undergraduate and postgraduate
              programs
            </p>
          </div>

          {/* Campus Life Card */}
          <div className="bg-white border border-[rgba(185,28,28,0.2)] border-t-[3px] border-t-[var(--gu-red)] p-6 box-border overflow-hidden flex flex-col items-center text-center hover:bg-[rgba(185,28,28,0.03)] hover:shadow-lg transition-all duration-300 rounded-none shadow-sm">
            <Users className="w-6 h-6 flex-shrink-0 text-[var(--gu-red)] mb-4 stroke-[1.5]" />
            <h3 className="font-serif text-xl md:text-2xl text-[var(--gu-red-dark)] font-semibold mb-2">
              Campus Life
            </h3>
            <p className="text-[var(--gu-text)] opacity-70 text-sm leading-relaxed font-sans">
              A vibrant community of students, faculty, and researchers
            </p>
          </div>

          {/* Achievements Card */}
          <div className="bg-white border border-[rgba(185,28,28,0.2)] border-t-[3px] border-t-[var(--gu-red)] p-6 box-border overflow-hidden flex flex-col items-center text-center hover:bg-[rgba(185,28,28,0.03)] hover:shadow-lg transition-all duration-300 rounded-none shadow-sm">
            <Award className="w-6 h-6 flex-shrink-0 text-[var(--gu-red)] mb-4 stroke-[1.5]" />
            <h3 className="font-serif text-xl md:text-2xl text-[var(--gu-red-dark)] font-semibold mb-2">
              Achievements
            </h3>
            <p className="text-[var(--gu-text)] opacity-70 text-sm leading-relaxed font-sans">
              Consistently ranked among Gujarat's top universities
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
