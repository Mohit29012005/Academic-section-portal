import { useState, useEffect } from "react";
import FacultyLayout from "../../components/FacultyLayout";
import { BookOpen, Mail, Phone, MapPin, Award, Save, X, Edit3, Shield, Calendar, Sparkles, Loader2, AlertTriangle, User, Hash, Clock } from "lucide-react";
import { facultyAPI } from "../../services/api";

const Profile = () => {
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await facultyAPI.profile();
        setFaculty(response.data);
        setEditData({
          phone: response.data.phone || "",
          address: response.data.address || "",
          gender: response.data.gender || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setSuccess("");
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({
      phone: faculty?.phone || "",
      address: faculty?.address || "",
      gender: faculty?.gender || "",
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
      facultyAPI.updateProfile(formData)
        .then((res) => {
          setFaculty({ ...faculty, avatar: res.data.avatar });
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
      const res = await facultyAPI.updateProfile(editData);
      setFaculty({ ...faculty, ...editData });
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
      <FacultyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-[var(--gu-gold)] animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm font-black uppercase tracking-widest">Accessing Secure Records...</p>
            </div>
        </div>
      </FacultyLayout>
    );
  }

  if (error && !faculty) {
    return (
      <FacultyLayout>
        <div className="text-center text-red-400 p-8 flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
          <span className="font-bold uppercase tracking-widest">{error || "Failed to load profile"}</span>
        </div>
      </FacultyLayout>
    );
  }

  const initials = faculty.name
    ? faculty.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "FA";
  
  const avatarUrl = faculty.avatar || faculty.name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name || initials)}&background=D4AF37&color=8B0000&size=256&font-size=0.35&bold=true`
    : null;

  return (
    <FacultyLayout>
      <div className="relative animate-fade-in">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gu-gold)]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-8 rounded-3xl border border-[var(--gu-gold)]/10 backdrop-blur-md shadow-2xl">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[var(--gu-gold)]" /> Faculty Dashboard
              </h1>
              <div className="flex items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
                <span>Core Authority Console</span>
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
                    {saving ? "Syncing..." : "Commit Update"}
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:border-[var(--gu-gold)]/50 transition-all shadow-xl group">
                  <Edit3 className="w-4 h-4 text-[var(--gu-gold)] group-hover:rotate-12 transition-transform" /> Override Profile
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
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--gu-gold)]/20 blur-3xl rounded-full"></div>
                
                <div className="relative mb-6 group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[var(--gu-gold)] border-4 border-white/10 shadow-2xl relative z-10 ring-4 ring-[var(--gu-gold)]/20 ring-offset-4 ring-offset-transparent group-hover:ring-[var(--gu-gold)]/50 transition-all duration-500">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={faculty.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                  {faculty.name || "Faculty Name"}
                </h2>
                <div className="flex items-center gap-2 text-[var(--gu-gold)] text-xs font-black uppercase tracking-[0.2em] mb-4 z-10 relative">
                  <Hash className="w-3 h-3" /> {faculty.employee_id || "FAC-001"}
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)] z-10 relative flex items-center gap-2 mb-4">
                   <Shield className="w-3 h-3" /> Principal Authority
                </div>

                <div className="w-full pt-4 border-t border-white/10 space-y-2 mt-4 z-10 relative flex flex-col items-center">
                   <p className="text-white/80 font-bold uppercase tracking-widest text-xs flex justify-between w-full">
                       <span>Desig:</span> <span className="text-[var(--gu-gold)]">{faculty.designation || "N/A"}</span>
                   </p>
                   <p className="text-white/80 font-bold uppercase tracking-widest text-xs flex justify-between w-full">
                       <span>Dept:</span> <span className="text-[var(--gu-gold)]">{faculty.department || "N/A"}</span>
                   </p>
                </div>

              </div>

              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <Award className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Credential</span>
                      <span className="text-white text-sm font-bold tracking-wide">{faculty.qualification || "Ph.D"}</span>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <Clock className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Experience</span>
                      <span className="text-white text-sm font-bold tracking-wide">{faculty.experience_years || 0} Years</span>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <Calendar className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Join Date</span>
                      <span className="text-white text-sm font-bold tracking-wide">{faculty.date_of_birth || "Unknown"}</span>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/5 transition-all">
                      <MapPin className="w-6 h-6 text-white/40 group-hover:text-[var(--gu-gold)] transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Base Zone</span>
                      <span className="text-white text-sm font-bold tracking-wide">{faculty.branch || "Kherva"}</span>
                  </div>
              </div>

            </div>

             {/* Right Column: Detailed Forms & Subjects */}
            <div className="lg:col-span-8 animate-slide-up animate-stagger-2 space-y-8">
              
              <div className="glass-panel p-8 md:p-10 rounded-3xl h-auto">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                      <User className="w-5 h-5 text-[var(--gu-gold)]" />
                   </div>
                   <div>
                       <h3 className="font-serif text-white text-2xl">Target Specifications</h3>
                       <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Contact & Identification Metrics</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Read-only Data */}
                  <div className="space-y-1 group">
                    <label className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-between">
                        Designation <LockIcon />
                    </label>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/60 font-medium cursor-not-allowed">
                        {faculty.name}
                    </div>
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-between">
                        Com-Link (Email) <LockIcon />
                    </label>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/60 font-medium cursor-not-allowed flex items-center gap-3">
                        <Mail className="w-4 h-4 opacity-50" /> {faculty.email || "Encrypted"}
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
                          value={editMode ? editData.phone : (faculty.phone || "")}
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
                      value={editMode ? editData.gender : (faculty.gender || "")}
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

                  <div className="md:col-span-2 space-y-1 group h-full flex flex-col">
                    <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`}>
                       Base Coordinates (Address)
                    </label>
                    <div className={`relative flex items-start transition-all flex-1 ${editMode ? 'ring-1 ring-[var(--gu-gold)]/50 rounded-xl bg-white/10' : 'bg-white/5 rounded-xl border border-white/5'}`}>
                        <MapPin className={`absolute left-4 top-4 w-4 h-4 ${editMode ? 'text-[var(--gu-gold)]' : 'text-white/40'}`} />
                        <textarea
                           readOnly={!editMode}
                           value={editMode ? editData.address : (faculty.address || "")}
                           onChange={(e) => handleChange("address", e.target.value)}
                           className="w-full bg-transparent text-white rounded-xl pl-12 pr-4 py-3 font-medium outline-none placeholder:text-white/20 resize-none min-h-[100px] transition-all"
                        />
                    </div>
                  </div>

                </div>
              </div>

              {/* Subject Modules */}
              <div className="glass-panel p-8 md:p-10 rounded-3xl h-auto">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                      <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
                   </div>
                   <div>
                       <h3 className="font-serif text-white text-2xl">Active Directives</h3>
                       <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Authorized Module Assignments</p>
                   </div>
                </div>

                {faculty.subjects && faculty.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faculty.subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="bg-white/5 border border-white/10 hover:border-[var(--gu-gold)]/30 hover:bg-white/10 transition-all rounded-2xl p-5 flex flex-col gap-3 group"
                      >
                        <div className="flex justify-between items-start">
                            <span className="bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em]">
                                {subject.code}
                            </span>
                        </div>
                        <h4 className="text-white font-bold text-lg leading-tight group-hover:text-[var(--gu-gold)] transition-colors">{subject.name || subject.code}</h4>
                        <div className="flex justify-between items-center text-xs mt-auto pt-3 border-t border-white/10 text-white/50 font-medium">
                            <span>{subject.course_name || "Course"}</span>
                            <span>Sem {subject.semester}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-white/30 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                      <BookOpen className="w-8 h-8 mb-3 opacity-50" />
                      <p className="font-bold tracking-widest uppercase text-xs">No active directives</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
};

const LockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0110 0v4"></path>
    </svg>
)

export default Profile;
