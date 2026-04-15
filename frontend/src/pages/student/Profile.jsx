import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { User, Mail, Hash, Phone, X, Save, Edit3, Shield, MapPin, Calendar, GraduationCap, AlertTriangle, Loader2, Sparkles, BookOpen } from "lucide-react";
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
    ? profile.name.split(" ").map((n) => n[0]).join("")
    : "AK";
  const avatarUrl = profile?.avatar || profile?.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || initials)}&background=D4AF37&color=8B0000&size=256&font-size=0.35&bold=true`
    : null;

  const handleEdit = () => {
    setEditMode(true);
    setSuccess("");
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({
      name: profile?.name || "",
      phone: profile?.phone || "",
      father_name: profile?.father_name || "",
      address: profile?.address || "",
      gender: profile?.gender || "",
    });
  };

  const handleChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("avatar", file);
      setSaving(true);
      studentAPI.updateProfile(formData)
        .then((res) => {
          setProfile({ ...profile, avatar: res.data.avatar });
          setSuccess("Photo updated successfully!");
        })
        .catch(() => setError("Failed to upload photo"))
        .finally(() => setSaving(false));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await studentAPI.updateProfile(editData);
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
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-[var(--gu-gold)] animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm font-black uppercase tracking-widest">Loading Arsenal...</p>
            </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="relative animate-fade-in">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gu-gold)]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-8 rounded-3xl border border-[var(--gu-gold)]/10 backdrop-blur-md shadow-2xl">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[var(--gu-gold)]" /> Student Core
              </h1>
              <div className="flex items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
                <span>Core Identity Management</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                <span>Active Link</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {editMode ? (
                <>
                  <button onClick={handleCancel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                    <X className="w-4 h-4" /> Abort
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--gu-gold)] text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Syncing..." : "Commit Override"}
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:border-[var(--gu-gold)]/50 transition-all shadow-xl group">
                  <Edit3 className="w-4 h-4 text-[var(--gu-gold)] group-hover:rotate-12 transition-transform" /> Initialize Override
                </button>
              )}
            </div>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-center gap-3 animate-slide-up ${error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
               {error ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <Sparkles className="w-5 h-5 flex-shrink-0" />}
               <span className="text-sm font-bold tracking-wide">{error || success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Identity Card */}
            <div className="lg:col-span-4 space-y-8 animate-slide-up animate-stagger-1">
              
              <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col items-center text-center">
                {/* Glow behind avatar */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--gu-gold)]/20 blur-3xl rounded-full"></div>
                
                <div className="relative mb-6 group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[var(--gu-gold)] border-4 border-white/10 shadow-2xl relative z-10 ring-4 ring-[var(--gu-gold)]/20 ring-offset-4 ring-offset-transparent group-hover:ring-[var(--gu-gold)]/50 transition-all duration-500">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gu-gold)] to-yellow-600 text-black text-4xl font-serif font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 z-20 bg-white/10 backdrop-blur-md border border-[var(--gu-gold)]/30 text-[var(--gu-gold)] w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--gu-gold)] hover:text-black hover:scale-110 transition-all shadow-xl">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <Edit3 className="w-4 h-4" />
                  </label>
                </div>
                
                <h2 className="font-serif text-3xl text-white font-bold tracking-tight mb-2 z-10 relative">
                  {profile?.name}
                </h2>
                <div className="flex items-center gap-2 text-[var(--gu-gold)] text-xs font-black uppercase tracking-[0.2em] mb-4 z-10 relative">
                  <Hash className="w-3 h-3" /> {profile?.enrollment_no}
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)] z-10 relative flex items-center gap-2">
                   <Shield className="w-3 h-3" /> Authorized Status
                </div>
              </div>

              {/* Quick Academic Summary Grid */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <GraduationCap className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Program</span>
                      <span className="text-white text-sm font-bold tracking-wide">{profile?.course_name || "N/A"}</span>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <BookOpen className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Semester</span>
                      <span className="text-white text-sm font-bold tracking-wide">Sem {profile?.current_semester || profile?.semester}</span>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <Calendar className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Batch</span>
                      <span className="text-white text-sm font-bold tracking-wide">{profile?.batch || "A"}</span>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <MapPin className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Zone</span>
                      <span className="text-white text-sm font-bold tracking-wide">{profile?.branch || "Kherva"}</span>
                  </div>
              </div>

            </div>

            {/* Right Column: Detailed Forms */}
            <div className="lg:col-span-8 animate-slide-up animate-stagger-2">
              <div className="glass-panel p-8 md:p-10 rounded-3xl h-full flex flex-col">
                
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                      <User className="w-5 h-5 text-[var(--gu-gold)]" />
                   </div>
                   <div>
                       <h3 className="font-serif text-white text-2xl">Target Specifications</h3>
                       <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Restricted & Linked Data Types</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Read-only Data */}
                  <div className="space-y-1 group">
                    <label className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-between">
                        Designation <LockIcon />
                    </label>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/60 font-medium cursor-not-allowed">
                        {profile?.name}
                    </div>
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-between">
                        Com-Link (Email) <LockIcon />
                    </label>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/60 font-medium cursor-not-allowed flex items-center gap-3">
                        <Mail className="w-4 h-4 opacity-50" /> {profile?.email || "Encrypted"}
                    </div>
                  </div>

                  {/* Editable Data (Phone / Gender) */}
                  <div className="space-y-1 group">
                    <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`}>
                       Signal Path (Phone)
                    </label>
                    <div className={`relative flex items-center transition-all ${editMode ? 'ring-1 ring-[var(--gu-gold)]/50 rounded-xl bg-white/10' : 'bg-white/5 rounded-xl border border-white/5'}`}>
                        <Phone className={`absolute left-4 w-4 h-4 ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`} />
                        <input
                          type="text"
                          readOnly={!editMode}
                          value={editMode ? editData.phone : (profile?.phone || "")}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="Link required"
                          className="w-full bg-transparent text-white rounded-xl pl-12 pr-4 py-3 font-medium outline-none placeholder:text-white/20 disabled:opacity-50 transition-all"
                        />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`}>
                       Biological Descriptor
                    </label>
                    <select
                      value={editMode ? editData.gender : (profile?.gender || "")}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      disabled={!editMode}
                      className={`w-full appearance-none rounded-xl px-4 py-3 font-medium outline-none transition-all ${editMode ? "bg-white/10 ring-1 ring-[var(--gu-gold)]/50 text-white cursor-pointer" : "bg-white/5 border border-white/5 text-white/50 cursor-not-allowed"}`}
                    >
                      <option value="" disabled>Select Descriptor</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Read-only Data (DOB) */}
                  <div className="space-y-1 group">
                    <label className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-between">
                        Origin Time (DOB) <LockIcon />
                    </label>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/60 font-medium cursor-not-allowed flex items-center gap-3">
                        <Calendar className="w-4 h-4 opacity-50" /> {profile?.date_of_birth || "Classified"}
                    </div>
                  </div>

                  {/* Secondary Edit Data */}
                  <div className="space-y-1 group">
                    <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`}>
                       Primary Guardian
                    </label>
                    <div className={`relative flex items-center transition-all ${editMode ? 'ring-1 ring-[var(--gu-gold)]/50 rounded-xl bg-white/10' : 'bg-white/5 rounded-xl border border-white/5'}`}>
                        <div className={`absolute left-4 w-4 h-4 rounded-full border-2 ${editMode ? 'border-[var(--gu-gold)]' : 'border-white/40'}`} />
                        <input
                           type="text"
                           readOnly={!editMode}
                           value={editMode ? editData.father_name : (profile?.father_name || "")}
                           onChange={(e) => handleChange("father_name", e.target.value)}
                           className="w-full bg-transparent text-white rounded-xl pl-12 pr-4 py-3 font-medium outline-none placeholder:text-white/20 disabled:opacity-50 transition-all"
                        />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1 group h-full flex flex-col">
                    <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`}>
                       Base Coordinates (Address)
                    </label>
                    <div className={`relative flex items-start transition-all flex-1 ${editMode ? 'ring-1 ring-[var(--gu-gold)]/50 rounded-xl bg-white/10' : 'bg-white/5 rounded-xl border border-white/5'}`}>
                        <MapPin className={`absolute left-4 top-4 w-4 h-4 ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`} />
                        <textarea
                           readOnly={!editMode}
                           value={editMode ? editData.address : (profile?.address || "")}
                           onChange={(e) => handleChange("address", e.target.value)}
                           className="w-full bg-transparent text-white rounded-xl pl-12 pr-4 py-3 font-medium outline-none placeholder:text-white/20 resize-none min-h-[100px] transition-all"
                        />
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

const LockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0110 0v4"></path>
    </svg>
)

export default Profile;
