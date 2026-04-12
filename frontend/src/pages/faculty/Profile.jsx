import { useState, useEffect } from "react";
import FacultyLayout from "../../components/FacultyLayout";
import { BookOpen, Mail, Phone, MapPin, Award, Save, X } from "lucide-react";
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
          name: response.data.name || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
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
    setEditData({
      gender: faculty?.gender || "",
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
      setFaculty({ ...faculty, ...res.data });
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
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
        </div>
      </FacultyLayout>
    );
  }

  if (error || !faculty) {
    return (
      <FacultyLayout>
        <div className="text-center text-red-400 p-8">
          {error || "Failed to load profile"}
        </div>
      </FacultyLayout>
    );
  }

  const initials = faculty.name
    ? faculty.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "FA";
  
  const avatarUrl = faculty.avatar || faculty.name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name || initials)}&background=D4AF37&color=8B0000&size=256&font-size=0.35&bold=true`
    : null;

  return (
    <FacultyLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--gu-gold)] pb-6 mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-2">
              Faculty Profile
            </h1>
            <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
              Manage your personal and academic details
            </p>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-yellow-500 transition-colors"
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

        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 mb-8">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-[var(--gu-gold)] flex-shrink-0 border-2 border-[#0A1628]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={faculty.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--gu-red-deep)] text-2xl md:text-3xl font-serif font-bold">
                  {initials}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition-colors">
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <span className="text-sm font-bold">✎</span>
            </label>
          </div>
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h2 className="font-serif text-white text-2xl md:text-3xl mb-1">
              {faculty.name || "Faculty Name"}
            </h2>
            <p className="text-[var(--gu-gold)] text-base md:text-lg mb-1">
              {faculty.designation || "Faculty"}
            </p>
            <p className="text-white opacity-70 mb-1 text-sm md:text-base">
              {faculty.department || "Department"}
            </p>
            {faculty.branch && (
              <p className="text-gray-400 text-xs mb-3">
                {faculty.branch}
              </p>
            )}
            <span className="inline-block border border-[var(--gu-gold)] text-[var(--gu-gold)] px-3 py-1 text-xs md:text-sm rounded-sm font-medium tracking-wider whitespace-nowrap">
              {faculty.employee_id || "FAC-001"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
              <h3 className="font-serif text-white text-xl border-b border-[var(--gu-border)] pb-3 mb-6">
                Personal Information
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Full Name</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium opacity-70">
                    {faculty.name || "Not provided"}
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Email</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium flex items-center gap-2 opacity-70">
                    <Mail className="w-4 h-4" />
                    <span>{faculty.email || "Not provided"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Phone</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium opacity-70">
                    {faculty.phone || "Not provided"}
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Address</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium opacity-70">
                    {faculty.address || "Not provided"}
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
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Qualification</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>{faculty.qualification || "Not provided"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Experience</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    {faculty.experience_years || 0} Years
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Gender</label>
                  <select
                    value={editMode ? editData.gender : faculty.gender || ""}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    disabled={!editMode}
                    className={`w-full bg-[#3D0F0F] border text-white p-3 rounded-sm font-medium ${editMode ? "border-[var(--gu-gold)] cursor-pointer" : "border-[var(--gu-border)] opacity-70 cursor-not-allowed"}`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Date of Birth</label>
                  <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                    {faculty.date_of_birth || "Not provided"}
                  </div>
                </div>
                {faculty.branch && (
                  <div className="sm:col-span-2">
                    <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1 font-semibold">Campus</label>
                    <div className="bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm font-medium">
                      {faculty.branch}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm overflow-hidden">
              <h3 className="font-serif text-white text-lg border-b border-[var(--gu-border)] pb-3 mb-4">
                Assigned Subjects
              </h3>
              {faculty.subjects && faculty.subjects.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  {faculty.subjects.map((subject, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b border-[var(--gu-border)] gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="w-5 h-5 text-[var(--gu-gold)] opacity-70 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-semibold">
                            {subject.name || subject.code}
                          </span>
                          <span className="text-[var(--gu-gold)] text-sm">
                            {subject.course_name || "Course"} - Sem {subject.semester}
                          </span>
                        </div>
                      </div>
                      <span className="bg-[rgba(207,181,59,0.15)] text-[var(--gu-gold)] border border-[var(--gu-border)] px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                        {subject.code}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No subjects assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
};

export default Profile;
