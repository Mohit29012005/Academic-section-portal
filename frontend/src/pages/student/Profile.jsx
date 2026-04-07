import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { User, Mail, Hash, Phone, Award } from "lucide-react";
import { studentAPI } from "../../services/api";

const DUMMY_PROFILE = {
  name: "Arjun Kumar", enrollment_no: "23032432001",
  email: "23032432001@gnu.ac.in", phone: "+91 98765 43210",
  course_name: "Master of Computer Applications", semester: 2,
  cgpa: 8.5, current_semester: 2,
};

const Profile = () => {
  const [profile, setProfile] = useState(DUMMY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentAPI.profile();
        setProfile(res.data);
      } catch {
        console.warn("Using dummy profile data - backend not available");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'AK';
  return (
    <StudentLayout>
      <div className="relative">
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url(/maxresdefault.jpg)", // Change to your image path
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.3, // Adjust darkness (lower = darker)
          }}
        ></div>
        <div className="animate-fade-in max-w-5xl mx-auto relative z-10">
          {/* Page Header */}
          <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-start md:items-end flex-col md:flex-row gap-4 word-wrap">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl md:text-3xl text-white mb-2 word-wrap break-words">
                Student Profile
              </h1>
              <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold word-wrap break-words">
                Manage your personal and academic information
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button className="flex-1 md:flex-none whitespace-nowrap bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#e6c949] transition-colors">
                Edit Profile
              </button>
              <button className="flex-1 md:flex-none whitespace-nowrap bg-[var(--gu-red)] text-white px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#5c0000] transition-colors">
                Download PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Avatar & Core Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm flex flex-col md:flex-row lg:flex-col items-center md:items-start lg:items-center text-center md:text-left lg:text-center gap-6 overflow-hidden box-border">
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex-shrink-0 rounded-full bg-[var(--gu-gold)] flex items-center justify-center text-[var(--gu-red-deep)] text-2xl lg:text-5xl font-serif font-bold border-4 border-[#0A1628] shadow-[0_0_0_1px_rgba(207,181,59,0.5)]">
                  {initials}
                </div>
                <div className="flex flex-col items-center md:items-start lg:items-center min-w-0">
                  <h2 className="font-serif text-xl md:text-2xl text-white font-bold mb-1 word-wrap break-words text-center md:text-left lg:text-center">
                    {profile.name}
                  </h2>
                  <p className="text-[var(--gu-gold)] text-sm font-semibold tracking-wider mb-2 word-wrap break-words">
                    {profile.enrollment_no}
                  </p>
                  <div className="inline-block mt-2 bg-[rgba(74,222,128,0.1)] border border-[#4ade80] text-[#4ade80] px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                    Active Student
                  </div>
                </div>
              </div>

              {/* Academic Summary Card */}
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                <h3 className="font-serif text-white text-lg border-b border-[var(--gu-border)] pb-2 mb-4">
                  Academic Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-white opacity-60 text-xs uppercase tracking-wider mb-1">
                      Program
                    </span>
                    <span className="text-white font-medium">
                      {profile.course_name || 'B.Tech Computer Engineering'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-white opacity-60 text-xs uppercase tracking-wider mb-1">
                      Current Semester
                    </span>
                    <span className="text-white font-medium">Semester {profile.current_semester || profile.semester}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--gu-border-red)] pt-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-white opacity-60 text-xs uppercase tracking-wider mb-1">
                        Current CGPA
                      </span>
                      <span className="text-[var(--gu-gold)] font-serif text-2xl font-bold">
                        {parseFloat(profile.cgpa || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-white opacity-60 text-xs uppercase tracking-wider mb-1">
                        Credits
                      </span>
                      <span className="text-white font-serif text-2xl font-bold">
                        120
                        <span className="text-sm opacity-50 font-sans">
                          /180
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm overflow-hidden box-border">
                <h3 className="font-serif text-white text-lg md:text-xl border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 pb-3 mb-6">
                  Personal Information
                </h3>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2 word-wrap">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-[var(--gu-gold)] opacity-70" />
                        <input
                          type="text"
                          readOnly
                          value={profile.name?.split(' ')[0] || 'Arjun'}
                          className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-sm pl-11 pr-4 py-3 font-medium"
                        />
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2 word-wrap">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-[var(--gu-gold)] opacity-70" />
                        <input
                          type="text"
                          readOnly
                          value={profile.name?.split(' ').slice(1).join(' ') || 'Kumar'}
                          className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-sm pl-11 pr-4 py-3 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2 word-wrap">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[var(--gu-gold)] opacity-70" />
                        <input
                          type="email"
                          readOnly
                          value={profile.email || 'arjun@ganpat.edu'}
                          className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-sm pl-11 pr-4 py-3 font-medium"
                        />
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2 word-wrap">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-[var(--gu-gold)] opacity-70" />
                        <input
                          type="text"
                          readOnly
                          value={profile.phone || '+91 98765 43210'}
                          className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-sm pl-11 pr-4 py-3 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2 word-wrap">
                      Enrollment Number
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3.5 w-5 h-5 text-[var(--gu-gold)] opacity-70" />
                      <input
                        type="text"
                        readOnly
                        value={profile.enrollment_no || '21BEIT001'}
                        className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-sm pl-11 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-[var(--gu-gold)] mt-2 italic word-wrap">
                      * Enrollment number cannot be changed
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Profile;
