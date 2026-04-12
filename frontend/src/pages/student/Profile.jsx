import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { User, Mail, Hash, Phone, X, Save } from "lucide-react";
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
    setEditData({
      gender: profile?.gender || "",
    });
    setEditMode(true);
    setSuccess("");
  };

  const handleCancel = () => {
    setEditMode(false);
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="relative">
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url(/maxresdefault.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.3,
          }}
        ></div>
        <div className="animate-fade-in max-w-5xl mx-auto relative z-10">
          <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl md:text-3xl text-white mb-2">
                Student Profile
              </h1>
              <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                Manage your personal and academic information
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex-1 md:flex-none whitespace-nowrap bg-gray-600 text-white px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 md:flex-none whitespace-nowrap bg-green-600 text-white px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex-1 md:flex-none whitespace-nowrap bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-yellow-500 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/50 border border-green-500 text-green-400 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm flex flex-col md:flex-row lg:flex-col items-center md:items-start lg:items-center text-center md:text-left lg:text-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex-shrink-0 rounded-full overflow-hidden bg-[var(--gu-gold)] border-4 border-[#0A1628]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--gu-red-deep)] text-2xl lg:text-5xl font-serif font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition-colors">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <span className="text-sm font-bold">✎</span>
                  </label>
                </div>
                <div className="flex flex-col items-center md:items-start lg:items-center min-w-0">
                  <h2 className="font-serif text-xl md:text-2xl text-white font-bold mb-1">
                    {profile?.name}
                  </h2>
                  <p className="text-[var(--gu-gold)] text-sm font-semibold tracking-wider mb-1">
                    {profile?.enrollment_no}
                  </p>
                  {profile?.branch && (
                    <p className="text-gray-400 text-xs mb-2">
                      {profile.branch}
                    </p>
                  )}
                  <div className="inline-block mt-2 bg-[rgba(74,222,128,0.1)] border border-[#4ade80] text-[#4ade80] px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-widest">
                    Active Student
                  </div>
                </div>
              </div>

              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                <h3 className="font-serif text-white text-lg border-b border-[var(--gu-border)] pb-2 mb-4">
                  Academic Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-white opacity-60 text-xs uppercase tracking-wider mb-1">Program</span>
                    <span className="text-white font-medium">{profile?.course_name || "N/A"}</span>
                  </div>
                  {profile?.branch && (
                    <div>
                      <span className="block text-white opacity-60 text-xs uppercase tracking-wider mb-1">Campus</span>
                      <span className="text-white font-medium">{profile.branch}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-white opacity-60 text-xs uppercase tracking-wider mb-1">Batch</span>
                    <span className="text-white font-medium">{profile?.batch || "A"}</span>
                  </div>
                  <div>
                    <span className="block text-white opacity-60 text-xs uppercase tracking-wider mb-1">Semester</span>
                    <span className="text-white font-medium">Semester {profile?.current_semester || profile?.semester}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm">
                <h3 className="font-serif text-white text-lg md:text-xl border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 pb-3 mb-6">
                  Personal Information
                </h3>

                <div className="space-y-6">
                  <div className="overflow-hidden">
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Full Name</label>
                    <input
                      type="text"
                      readOnly
                      value={profile?.name || ""}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        readOnly
                        value={profile?.email || ""}
                        className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Phone</label>
                      <input
                        type="text"
                        readOnly
                        value={profile?.phone || "Not available"}
                        className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Roll Number</label>
                    <input
                      type="text"
                      readOnly
                      value={profile?.enrollment_no || ""}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                    />
                  </div>

                  {profile?.branch && (
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Campus</label>
                      <input
                        type="text"
                        readOnly
                        value={profile.branch}
                        className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Date of Birth</label>
                      <input
                        type="text"
                        readOnly
                        value={profile?.date_of_birth || "Not available"}
                        className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Gender</label>
                      <select
                        value={editMode ? editData.gender : profile?.gender || ""}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        disabled={!editMode}
                        className={`w-full box-border bg-[#3D0F0F] border text-white rounded-sm pl-4 pr-4 py-3 font-medium ${editMode ? "border-[var(--gu-gold)] cursor-pointer text-white" : "border-[var(--gu-border)] opacity-70 cursor-not-allowed"}`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Father's Name</label>
                    <input
                      type="text"
                      readOnly
                      value={profile?.father_name || "Not available"}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="overflow-hidden">
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Address</label>
                    <textarea
                      readOnly
                      value={profile?.address || "Not available"}
                      rows="2"
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white rounded-sm pl-4 pr-4 py-3 font-medium opacity-70 cursor-not-allowed resize-none"
                    />
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

export default Profile;
