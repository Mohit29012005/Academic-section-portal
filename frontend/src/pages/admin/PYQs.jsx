import AdminLayout from "../../components/AdminLayout";
import { BookOpen, FileText } from "lucide-react";

const AdminPYQs = () => {
  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[var(--gu-gold)]/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-white">
              Previous Year Question Papers
            </h1>
          </div>
          <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
            Manage and view PYQs across all courses
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--gu-gold)]/20 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[var(--gu-gold)]" />
            </div>
            <div>
              <h3 className="text-white font-serif text-lg mb-2">PYQ Management</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                View and manage Previous Year Question Papers across all courses and semesters. 
                Students and Faculty can generate PYQs from their respective portals.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6">
            <h3 className="text-white font-serif text-lg mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
              Student Portal
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Students can access PYQs from their dashboard and generate papers for their courses.
            </p>
            <div className="flex items-center text-[var(--gu-gold)] text-sm font-semibold">
              Route: /student/pyqs
            </div>
          </div>

          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6">
            <h3 className="text-white font-serif text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--gu-gold)]" />
              Faculty Portal
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Faculty members can generate and manage PYQ papers for their subjects.
            </p>
            <div className="flex items-center text-[var(--gu-gold)] text-sm font-semibold">
              Route: /faculty/pyqs
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6">
          <h3 className="text-white font-serif text-lg mb-6 border-b border-[var(--gu-border)] pb-3">
            Available Courses
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["BCA", "MCA", "B.Sc IT", "B.Tech CSE"].map((course) => (
              <div key={course} className="bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm p-4 text-center">
                <p className="text-[var(--gu-gold)] font-serif text-lg font-bold">{course}</p>
                <p className="text-white/50 text-xs mt-1">6 Semesters</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPYQs;
