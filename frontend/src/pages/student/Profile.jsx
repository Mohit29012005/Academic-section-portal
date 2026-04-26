import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import {
  User, Mail, Hash, Phone, X, Save, Edit3, Shield,
  MapPin, Calendar, GraduationCap, AlertTriangle, Loader2,
  CheckCircle, Lock, Users, BookOpen, Star
} from "lucide-react";
import { studentAPI } from "../../services/api";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentAPI.profile();
        setProfile(res.data);
        setEditData({
          name: res.data.name || "",
          phone: res.data.phone || "",
          father_name: res.data.father_name || "",
          address: res.data.address || "",
          gender: res.data.gender || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
    : "ST";

  const avatarUrl = profile?.avatar
    ? profile.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || initials)}&background=D4AF37&color=8B0000&size=256&font-size=0.35&bold=true`;

  const handleEdit = () => { setEditMode(true); setSuccess(""); setError(""); };
  const handleCancel = () => {
    setEditMode(false);
    setEditData({ name: profile?.name || "", phone: profile?.phone || "", father_name: profile?.father_name || "", address: profile?.address || "", gender: profile?.gender || "" });
  };
  const handleChange = (field, value) => setEditData({ ...editData, [field]: value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setSaving(true);
    studentAPI.updateProfile(formData)
      .then((res) => { setProfile({ ...profile, avatar: res.data.avatar }); setSuccess("Photo updated!"); })
      .catch(() => setError("Failed to upload photo"))
      .finally(() => setSaving(false));
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await studentAPI.updateProfile(editData);
      setProfile({ ...profile, ...editData });
      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--gu-gold)]/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-[var(--gu-gold)] animate-spin"></div>
              <div className="absolute inset-3 rounded-full border-r-2 border-red-400/60 animate-spin" style={{animationDirection:'reverse', animationDuration:'0.8s'}}></div>
            </div>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">Loading Profile...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="relative min-h-screen pb-12">
        {/* Background orbs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[var(--gu-gold)]/5 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-red-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-1">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-2">
            <div>
              <p className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] mb-1 flex items-center gap-2">
                <User className="w-3 h-3" /> Student Portal
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight">My Profile</h1>
            </div>

            <div className="flex gap-3">
              {editMode ? (
                <>
                  <button onClick={handleCancel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gu-gold)] to-yellow-500 text-black text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--gu-gold)]/10 border border-[var(--gu-gold)]/30 text-[var(--gu-gold)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--gu-gold)]/20 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all group">
                  <Edit3 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Alert banners */}
          {(error || success) && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {error ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-semibold">{error || success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Left: Identity Card ──────────────────────────── */}
            <div className="lg:col-span-4 space-y-5">

              {/* Avatar Hero Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--gu-gold)]/20 bg-gradient-to-b from-[#2a0808] to-[#160404] p-8 flex flex-col items-center text-center shadow-2xl">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5" style={{backgroundImage:"repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(212,175,55,0.5) 20px, rgba(212,175,55,0.5) 21px)"}}></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--gu-gold)] to-transparent"></div>

                {/* Avatar */}
                <div className="relative mb-5 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gu-gold)] to-yellow-600 rounded-full blur opacity-60 group-hover:opacity-90 transition-opacity"></div>
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--gu-gold)]/40 shadow-xl">
                    <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute -bottom-1 -right-1 z-20 bg-[#2a0808] border border-[var(--gu-gold)]/40 text-[var(--gu-gold)] w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--gu-gold)] hover:text-black transition-all shadow-lg group-hover:scale-110">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <Edit3 className="w-4 h-4" />
                  </label>
                </div>

                <h2 className="font-serif text-2xl text-white font-bold tracking-tight mb-1">{profile?.name}</h2>
                <div className="flex items-center gap-1.5 text-[var(--gu-gold)] text-xs font-bold mb-4">
                  <Hash className="w-3 h-3" /> {profile?.enrollment_no}
                </div>

                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  <Shield className="w-3.5 h-3.5" /> Active Student
                </div>

                <div className="w-full border-t border-white/5 pt-5 grid grid-cols-2 gap-3">
                  {[
                    { icon: GraduationCap, label: "Program", val: profile?.course_code || "N/A" },
                    { icon: BookOpen, label: "Semester", val: `Sem ${profile?.current_semester || profile?.semester || "—"}` },
                    { icon: Calendar, label: "Batch", val: profile?.batch || "—" },
                    { icon: MapPin, label: "Campus", val: profile?.branch || "Kherva" },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="bg-white/3 rounded-xl p-3 text-center border border-white/5 hover:bg-white/6 transition-colors">
                      <Icon className="w-4 h-4 text-white/40 mx-auto mb-1.5" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
                      <p className="text-white text-xs font-bold truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Quick Stats */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Academic Summary</h3>
                {[
                  { label: "CGPA", val: profile?.cgpa ? parseFloat(profile.cgpa).toFixed(2) : "—", color: "text-[var(--gu-gold)]" },
                  { label: "Total Semesters", val: profile?.total_semesters || 8, color: "text-blue-400" },
                  { label: "Status", val: profile?.status || "Active", color: "text-emerald-400" },
                  { label: "Admission Year", val: profile?.admission_year || "—", color: "text-purple-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-xs font-medium">{label}</span>
                    <span className={`text-xs font-black ${color}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Details Form ──────────────────────────── */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#1e0505]/80 to-[#130303]/80 backdrop-blur-xl p-7 h-full">

                <div className="flex items-center gap-3 mb-7 pb-5 border-b border-white/6">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${editMode ? 'bg-[var(--gu-gold)]/20 border border-[var(--gu-gold)]/40' : 'bg-white/5 border border-white/10'}`}>
                    <User className={`w-4.5 h-4.5 ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Personal Information</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      {editMode ? "Editing mode — changes will be saved" : "View only — click Edit Profile to modify"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Read-only: Full Name */}
                  <FieldGroup label="Full Name" locked icon={<User className="w-4 h-4" />}>
                    <span>{profile?.name}</span>
                  </FieldGroup>

                  {/* Read-only: Email */}
                  <FieldGroup label="Email Address" locked icon={<Mail className="w-4 h-4" />}>
                    <span className="truncate">{profile?.email || "—"}</span>
                  </FieldGroup>

                  {/* Editable: Phone */}
                  <FieldGroup label="Phone Number" icon={<Phone className="w-4 h-4" />} editMode={editMode}>
                    <input
                      type="tel"
                      readOnly={!editMode}
                      value={editMode ? editData.phone : (profile?.phone || "")}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder:text-white/25"
                    />
                  </FieldGroup>

                  {/* Editable: Gender */}
                  <FieldGroup label="Gender" icon={<Users className="w-4 h-4" />} editMode={editMode}>
                    <select
                      value={editMode ? editData.gender : (profile?.gender || "")}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      disabled={!editMode}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="" disabled className="bg-[#2a0808]">Select Gender</option>
                      <option value="Male" className="bg-[#2a0808]">Male</option>
                      <option value="Female" className="bg-[#2a0808]">Female</option>
                      <option value="Other" className="bg-[#2a0808]">Other</option>
                    </select>
                  </FieldGroup>

                  {/* Read-only: DOB */}
                  <FieldGroup label="Date of Birth" locked icon={<Calendar className="w-4 h-4" />}>
                    <span>{profile?.date_of_birth || "Not set"}</span>
                  </FieldGroup>

                  {/* Editable: Father Name */}
                  <FieldGroup label="Father's Name" icon={<Star className="w-4 h-4" />} editMode={editMode}>
                    <input
                      type="text"
                      readOnly={!editMode}
                      value={editMode ? editData.father_name : (profile?.father_name || "")}
                      onChange={(e) => handleChange("father_name", e.target.value)}
                      placeholder="Enter father's name"
                      className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder:text-white/25"
                    />
                  </FieldGroup>

                  {/* Editable: Address — spans full width */}
                  <div className="md:col-span-2">
                    <FieldGroup label="Address" icon={<MapPin className="w-4 h-4" />} editMode={editMode}>
                      <textarea
                        readOnly={!editMode}
                        value={editMode ? editData.address : (profile?.address || "")}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="Enter your address"
                        rows={3}
                        className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder:text-white/25 resize-none"
                      />
                    </FieldGroup>
                  </div>
                </div>

                {/* Security Note */}
                <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                  <Lock className="w-4 h-4 text-white/25 flex-shrink-0" />
                  <p className="text-white/35 text-xs">Sensitive fields like Name, Email, and Date of Birth are locked. Contact administration to update them.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

/* ── Reusable Field Component ───────────────────────────────────── */
const FieldGroup = ({ label, locked, icon, editMode, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center justify-between">
      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${editMode ? 'text-[var(--gu-gold)]' : locked ? 'text-white/35' : 'text-white/50'}`}>
        {label}
      </span>
      {locked && <Lock className="w-3 h-3 text-white/20" />}
    </label>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
      editMode
        ? 'bg-white/5 border-[var(--gu-gold)]/40 shadow-[0_0_0_3px_rgba(212,175,55,0.08)]'
        : locked
          ? 'bg-white/2 border-white/6 cursor-not-allowed'
          : 'bg-white/3 border-white/8'
    }`}>
      <span className={`flex-shrink-0 transition-colors ${editMode ? 'text-[var(--gu-gold)]/70' : 'text-white/25'}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0 text-sm font-medium text-white/70">
        {children}
      </div>
    </div>
  </div>
);

export default Profile;
