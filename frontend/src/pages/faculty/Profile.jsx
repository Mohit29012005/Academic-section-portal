import FacultyLayout from "../../components/FacultyLayout";
import { BookOpen } from "lucide-react";

const Profile = () => {
  return (
    <FacultyLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--gu-gold)] pb-6 mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-2 word-wrap break-words">
              Faculty Profile
            </h1>
            <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold word-wrap break-words">
              Manage your personal and academic details
            </p>
          </div>
          <button className="w-full sm:w-auto text-center bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-5 py-2.5 md:py-2 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#e6c949] transition-colors flex-shrink-0 whitespace-nowrap">
            Edit Profile
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 mb-8 overflow-hidden box-border">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--gu-gold)] flex items-center justify-center text-[var(--gu-red-deep)] text-2xl md:text-3xl font-serif font-bold flex-shrink-0 border-2 border-[#0A1628] shadow-[0_0_0_1px_rgba(207,181,59,0.5)]">
            PS
          </div>
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h2 className="font-serif text-white text-2xl md:text-3xl mb-1 word-wrap break-words">
              Dr. Priya Singh
            </h2>
            <p className="text-[var(--gu-gold)] text-base md:text-lg mb-2 word-wrap break-words">
              Associate Professor
            </p>
            <p className="text-white opacity-70 mb-4 text-sm md:text-base word-wrap break-words">
              Department of Computer Engineering
            </p>
            <span className="inline-block border border-[var(--gu-gold)] text-[var(--gu-gold)] px-3 py-1 text-xs md:text-sm rounded-sm font-medium tracking-wider whitespace-nowrap truncate max-w-full">
              GU-FAC-001
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
              <h3 className="font-serif text-white text-xl border-b border-[var(--gu-border)] pb-3 mb-6">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Email
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium overflow-x-hidden">
                    priya.singh@ganpatuniversity.ac.in
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Phone
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    +91 98765 12345
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Office
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    Room 204, CS Block
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Office Hours
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    Mon–Fri, 11AM–1PM
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
              <h3 className="font-serif text-white text-xl border-b border-[var(--gu-border)] pb-3 mb-6">
                Academic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Specialization
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium ">
                    Algorithms &amp; Data Structures
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Experience
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    12 Years
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Qualification
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    Ph.D. Computer Science
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold opacity-90">
                    Publications
                  </label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    18 Research Papers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm overflow-hidden box-border">
              <h3 className="font-serif text-white text-lg md:text-xl border-b border-[var(--gu-border)] pb-3 mb-4 word-wrap break-words">
                Assigned Subjects
              </h3>
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 md:p-4 border-b border-[var(--gu-border)] gap-3 md:gap-4">
                  <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0 w-full sm:w-auto">
                    <BookOpen className="w-5 h-5 text-[var(--gu-gold)] opacity-70 flex-shrink-0 mt-1 md:mt-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold text-base md:text-lg word-wrap break-words">
                        Data Structures
                      </span>
                      <span className="text-[var(--gu-gold)] text-sm word-wrap break-words">
                        B.Tech Sem 4
                      </span>
                    </div>
                  </div>
                  <span className="bg-[rgba(207,181,59,0.15)] text-[var(--gu-gold)] border border-[var(--gu-border)] px-2 md:px-3 py-1 rounded-sm text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap self-start sm:self-auto flex-shrink-0 mt-1 sm:mt-0">
                    Section A, B
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 md:p-4 border-b border-[var(--gu-border)] gap-3 md:gap-4">
                  <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0 w-full sm:w-auto">
                    <BookOpen className="w-5 h-5 text-[var(--gu-gold)] opacity-70 flex-shrink-0 mt-1 md:mt-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold text-base md:text-lg word-wrap break-words">
                        Algorithms
                      </span>
                      <span className="text-[var(--gu-gold)] text-sm word-wrap break-words">
                        B.Tech Sem 5
                      </span>
                    </div>
                  </div>
                  <span className="bg-[rgba(207,181,59,0.15)] text-[var(--gu-gold)] border border-[var(--gu-border)] px-2 md:px-3 py-1 rounded-sm text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap self-start sm:self-auto flex-shrink-0 mt-1 sm:mt-0">
                    Section A, B, C
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 md:p-4 border-b-transparent gap-3 md:gap-4">
                  <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0 w-full sm:w-auto">
                    <BookOpen className="w-5 h-5 text-[var(--gu-gold)] opacity-70 flex-shrink-0 mt-1 md:mt-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold text-base md:text-lg word-wrap break-words">
                        Web Development
                      </span>
                      <span className="text-[var(--gu-gold)] text-sm word-wrap break-words">
                        B.Tech Sem 3
                      </span>
                    </div>
                  </div>
                  <span className="bg-[rgba(207,181,59,0.15)] text-[var(--gu-gold)] border border-[var(--gu-border)] px-2 md:px-3 py-1 rounded-sm text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap self-start sm:self-auto flex-shrink-0 mt-1 sm:mt-0">
                    Section A
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
};

export default Profile;
