import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Users,
  BookOpen,
  MapPin,
  Filter,
  AlertCircle
} from "lucide-react";
import { academicsAPI, adminAPI } from "../../services/api";

const Timetable = () => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedSection, setSelectedSection] = useState("A");
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Slot selection for adding
  const [activeSlot, setActiveSlot] = useState(null); // { day, slotIndex }
  const [formData, setFormData] = useState({
    subject: "",
    faculty: "",
    room: ""
  });

  const timeSlots = [
    { label: "Slot 1", start: "13:25", end: "14:20" },
    { label: "Slot 2", start: "14:25", end: "15:20" },
    { label: "Slot 3", start: "15:25", end: "16:10" }, // Shortened before lunch
    { label: "LUNCH", start: "16:10", end: "16:30" }, // Lunch 16:10 to 16:30 (as per user 4:10 PM)
    { label: "Slot 4", start: "16:35", end: "17:30" },
    { label: "Slot 5", start: "17:35", end: "18:25" },
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, fRes] = await Promise.all([
          academicsAPI.courses(),
          adminAPI.faculty()
        ]);
        setCourses(cRes.data);
        setFaculty(fRes.data);
      } catch (err) {
        console.error("Error fetching initial data", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedSemester) {
      fetchSubjects();
      fetchTimetable();
    }
  }, [selectedCourse, selectedSemester, selectedSection]);

  const fetchSubjects = async () => {
    try {
      const res = await academicsAPI.subjects({
        course_id: selectedCourse,
        semester: selectedSemester
      });
      setSubjects(res.data);
    } catch (err) {
      console.error("Error fetching subjects", err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await academicsAPI.timetable({
        course_id: selectedCourse,
        semester: selectedSemester,
        section: selectedSection
      });
      setTimetableSlots(res.data);
    } catch (err) {
      console.error("Error fetching timetable", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = (day, slot) => {
    setActiveSlot({ day, slot });
    setShowModal(true);
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to remove this class from the timetable?")) return;
    try {
      await academicsAPI.deleteTimetableSlot(slotId);
      fetchTimetable();
    } catch (err) {
      alert("Error deleting slot");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.faculty || !formData.room) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      course: selectedCourse,
      semester: parseInt(selectedSemester),
      day_of_week: activeSlot.day,
      start_time: activeSlot.slot.start,
      end_time: activeSlot.slot.end,
      subject: formData.subject,
      faculty: formData.faculty,
      room: formData.room,
      section: selectedSection
    };

    try {
      await academicsAPI.createTimetableSlot(payload);
      setShowModal(false);
      setFormData({ subject: "", faculty: "", room: "" });
      fetchTimetable();
    } catch (err) {
      alert(err.response?.data?.error || "Error creating slot. Check for clashing schedules.");
    }
  };

  const getSlotContent = (day, startTime) => {
    // Normalize time string from DB (e.g., "13:25:00" to "13:25")
    return timetableSlots.find(s =>
      s.day_of_week === day &&
      s.start_time.substring(0, 5) === startTime
    );
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-white tracking-wide">University Timetable Manager</h1>
            <p className="text-[var(--gu-gold)] text-sm mt-1 flex items-center opacity-80">
              <Calendar className="w-4 h-4 mr-2" />
              Establish weekly recurring schedules for academic courses
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-gold)] p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-white text-xs uppercase tracking-widest opacity-70">Program / Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 focus:border-[var(--gu-gold)] outline-none transition-colors"
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.course_id} value={c.course_id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-white text-xs uppercase tracking-widest opacity-70">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 focus:border-[var(--gu-gold)] outline-none transition-colors"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-white text-xs uppercase tracking-widest opacity-70">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 focus:border-[var(--gu-gold)] outline-none transition-colors"
              >
                {["A", "B", "C", "D"].map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchTimetable}
              className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 py-2 font-bold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" /> Load Schedule
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-[var(--gu-gold)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
          </div>
        ) : selectedCourse ? (
          <div className="overflow-x-auto bg-[var(--gu-red-card)] border border-[var(--gu-gold)] shadow-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--gu-red-deep)] border-b border-[var(--gu-gold)]">
                  <th className="p-4 text-[var(--gu-gold)] text-left font-serif border-r border-[rgba(212,175,55,0.3)]">Time / Day</th>
                  {days.map(day => (
                    <th key={day} className="p-4 text-white text-center font-serif min-w-[150px] border-r border-[rgba(212,175,55,0.3)] last:border-0">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, idx) => (
                  <tr key={idx} className="border-b border-[rgba(212,175,55,0.1)] last:border-0 h-32">
                    <td className="bg-[var(--gu-red-deep)] p-4 border-r border-[rgba(212,175,55,0.3)] w-32">
                      <div className="text-white text-sm font-bold flex flex-col items-center">
                        <Clock className="w-4 h-4 text-[var(--gu-gold)] mb-1" />
                        {slot.start} - {slot.end}
                        <span className="text-[10px] text-[var(--gu-gold)] uppercase mt-1 tracking-widest">{slot.label}</span>
                      </div>
                    </td>

                    {days.map(day => {
                      const data = getSlotContent(day, slot.start);
                      if (slot.label === "LUNCH") {
                        return (
                          <td key={day} className="p-4 text-center bg-[rgba(212,175,55,0.05)] border-r border-[rgba(212,175,55,0.3)] last:border-0">
                            <span className="text-[var(--gu-gold)] text-xs font-bold tracking-[0.3em] vertical-text">LUNCH BREAK</span>
                          </td>
                        );
                      }
                      return (
                        <td key={day} className="p-2 border-r border-[rgba(212,175,55,0.3)] last:border-0 group relative hover:bg-[rgba(255,255,255,0.02)]">
                          {data ? (
                            <div className="h-full bg-black/40 border border-[rgba(212,175,55,0.3)] p-3 rounded-sm flex flex-col justify-between">
                              <div>
                                <div className="text-[var(--gu-gold)] text-xs font-bold mb-1 line-clamp-2">{data.subject_name}</div>
                                <div className="text-white/60 text-[10px] flex items-center mb-1">
                                  <Users className="w-3 h-3 mr-1" /> {data.faculty_name}
                                </div>
                                <div className="text-white/60 text-[10px] flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" /> Room {data.room}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteSlot(data.slot_id)}
                                className="absolute top-1 right-1 p-1 bg-red-900/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddSlot(day, slot)}
                              className="w-full h-full flex flex-col items-center justify-center text-white/20 hover:text-[var(--gu-gold)] hover:bg-[rgba(212,175,55,0.05)] transition-all border border-dashed border-white/10 hover:border-[var(--gu-gold)] rounded-sm"
                            >
                              <Plus className="w-5 h-5 mb-1" />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Assign</span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-[var(--gu-red-card)] border border-[var(--gu-gold)] text-center">
            <Calendar className="w-16 h-16 text-[var(--gu-gold)] opacity-30 mb-4" />
            <h2 className="text-2xl text-white font-serif mb-2">Select a Course to Manage Timetable</h2>
            <p className="text-white/60 max-w-md mx-auto">Please select a program, semester, and section using the filters above to load or create a class schedule.</p>
          </div>
        )}

        {/* Add Slot Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--gu-red-card)] border-2 border-[var(--gu-gold)] w-full max-w-md shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6 border-b border-[var(--gu-gold)] pb-4">
                <h3 className="text-xl font-serif text-[var(--gu-gold)]">Assign New Class</h3>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="mb-4 bg-black/40 p-3 flex items-center justify-between border border-white/5">
                <div className="text-xs text-white/60 uppercase tracking-widest">Selected Slot</div>
                <div className="text-sm text-[var(--gu-gold)] font-bold">{activeSlot.day}, {activeSlot.slot.start} - {activeSlot.slot.end}</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-white text-[10px] uppercase tracking-widest opacity-70">Subject Module</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 outline-none focus:border-[var(--gu-gold)]"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-white text-[10px] uppercase tracking-widest opacity-70">In-Charge Faculty</label>
                  <select
                    required
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 outline-none focus:border-[var(--gu-gold)]"
                  >
                    <option value="">Select Faculty</option>
                    {faculty.map(f => (
                      <option key={f.faculty_id} value={f.faculty_id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-white text-[10px] uppercase tracking-widest opacity-70">Lecture Room / Lab</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. C-102 or AI Lab"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 outline-none focus:border-[var(--gu-gold)]"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-[var(--gu-gold)] text-white hover:bg-[rgba(212,175,55,0.1)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-8 py-2 font-bold hover:bg-yellow-500 transition-colors"
                  >
                    Create Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
        .vertical-text {
            writing-mode: vertical-rl;
            text-orientation: upright;
            letter-spacing: 0.1em;
        }
      `}</style>
      </div>
    </AdminLayout>
  );
};

export default Timetable;
