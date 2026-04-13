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
  Loader2,
  FileDown
} from "lucide-react";
import { academicsAPI, adminAPI } from "../../services/api";

// Helper: Convert 24h time string "HH:MM" to 12h format "H:MM AM/PM"
const formatTime12 = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const normalizeCourseToken = (value) => (value || "").replace(/\s+/g, "").toUpperCase();

const formatCourseLabel = (course) => {
  const name = (course?.name || "").trim();
  const code = (course?.code || "").trim();

  if (!name) return code;
  if (!code) return name;

  const normalizedName = normalizeCourseToken(name);
  const normalizedCode = normalizeCourseToken(code);

  if (
    normalizedName === normalizedCode ||
    normalizedName.includes(`(${normalizedCode})`) ||
    normalizedName.endsWith(normalizedCode)
  ) {
    return name;
  }

  return `${name} (${code})`;
};

const Timetable = () => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [courseShift, setCourseShift] = useState("NOON");
  const [courseSemesters, setCourseSemesters] = useState({});
  
  // GANPAT DCS Timetable Slots - Morning Shift (BTECH + Masters)
  const morningSlots = [
    { label: "Slot 1", start: "08:00", end: "08:55" },
    { label: "Slot 2", start: "08:55", end: "09:40" },
    { label: "BREAK", start: "09:40", end: "10:15" },
    { label: "Slot 3", start: "10:15", end: "11:10" },
    { label: "Slot 4", start: "11:10", end: "12:00" },
    { label: "Slot 5", start: "12:00", end: "12:55" },
  ];
  
  // GANPAT DCS Timetable Slots - Noon Shift (BCA + BSc)
  const noonSlots = [
    { label: "Slot 1", start: "12:00", end: "12:55" },
    { label: "BREAK", start: "12:55", end: "13:25" },
    { label: "Slot 2", start: "13:25", end: "14:20" },
    { label: "LUNCH", start: "14:20", end: "15:15" },
    { label: "Slot 3", start: "15:15", end: "16:10" },
    { label: "TEA", start: "16:10", end: "16:30" },
    { label: "Slot 4", start: "16:30", end: "17:20" },
    { label: "Slot 5", start: "17:20", end: "18:10" },
  ];
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pdfGenerating, setPDFGenerating] = useState(false);

  // Slot selection for adding
  const [activeSlot, setActiveSlot] = useState(null); // { day, slotIndex }
  const [formData, setFormData] = useState({
    subject: "",
    faculty: "",
    room: ""
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, fRes, roomsRes] = await Promise.all([
          academicsAPI.courses(),
          adminAPI.faculty(),
          academicsAPI.rooms()
        ]);
        setCourses(cRes.data);
        const semMap = {};
        cRes.data.forEach(c => {
          semMap[c.course_id] = c.total_semesters || 6;
        });
        setCourseSemesters(semMap);
        setFaculty(fRes.data);
        setRooms(roomsRes.data);
      } catch (err) {
        console.error("Error fetching initial data", err);
      }
    };
    fetchData();
  }, []);

  // Auto-load timetable when course or semester changes
  useEffect(() => {
    if (selectedCourse && selectedSemester) {
      fetchSubjects();
      fetchTimetable();
      // Set shift based on selected course
      const course = courses.find(c => c.course_id === selectedCourse);
      if (course) {
        setCourseShift(course.shift || "NOON");
      }
    }
  }, [selectedCourse, selectedSemester, courses.length]);

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
      });
      setTimetableSlots(res.data || []);
    } catch (err) {
      console.error("Error fetching timetable", err);
      setTimetableSlots([]);
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
      room_id: formData.room,
      section: "A"
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

  // ONE-CLICK PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!selectedCourse || !selectedSemester) {
      alert("Please select a course and semester first.");
      return;
    }
    setPDFGenerating(true);
    try {
      const selectedCourseObj = courses.find(c => c.course_id === selectedCourse);
      const courseCode = selectedCourseObj?.code || null;
      const sem = selectedSemester ? parseInt(selectedSemester) : null;
      
      const response = await academicsAPI.generateTimetablePDF(courseCode, sem);
      
      // Check if response is actually a PDF
      const contentType = response.headers?.['content-type'];
      if (contentType && !contentType.includes('pdf')) {
        throw new Error(response.data?.error || "Server returned non-PDF response");
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const filename = selectedCourseObj 
        ? `timetable_${selectedCourseObj.code}_S${sem}.pdf` 
        : `timetable_all_courses.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Failed to generate PDF: ${errorMsg}`);
    } finally {
      setPDFGenerating(false);
    }
  };

  // Get current time slots based on shift
  const currentSlots = courseShift === "MORNING" ? morningSlots : noonSlots;
  const shiftLabel = courseShift === "MORNING" 
    ? `Morning Shift (${formatTime12("08:00")} - ${formatTime12("13:00")})` 
    : `Noon Shift (${formatTime12("12:00")} - ${formatTime12("18:10")})`;
  const shiftCourses = courseShift === "MORNING" 
    ? "MCA, BTech, MTech, MSc" 
    : "BCA, BSc-IT, BSc-IT(IMS), BSc-IT(CS), MSc-IT(AI/ML)";
  const saturdayActiveLabels =
    courseShift === "MORNING"
      ? new Set(["Slot 1", "Slot 2", "BREAK", "Slot 3"])
      : new Set(["Slot 1", "BREAK", "Slot 2", "LUNCH", "Slot 3"]);
  const isSaturdayOpenSlot = (slotLabel) => saturdayActiveLabels.has(slotLabel);

  // Build subject legend from timetable data
  const subjectLegend = {};
  timetableSlots.forEach(slot => {
    if (slot.subject_code && slot.subject_name) {
      subjectLegend[slot.subject_code] = slot.subject_name;
    }
  });

  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-7xl mx-auto space-y-10 relative z-10 px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-10 rounded-3xl border border-[var(--gu-gold)]/10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-3 tracking-tight">
              Temporal Intelligence
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.4em] opacity-80">
              <span>GANPAT UNIVERSITY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
              <span>DCS Timetable Matrix</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
              <span>Academic Engine v2.0</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gu-gold)]/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-[var(--gu-gold)]/10 transition-colors duration-1000"></div>
        </div>

        {/* Global Filters - High Fidelity Control Bar */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl animate-slide-up flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[250px] space-y-3">
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Program Nomenclature</label>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedSemester("1"); }}
              className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
            >
              <option value="" className="bg-[#1A0505]">Select Academic Track</option>
              {courses.map(c => (
                <option key={c.course_id} value={c.course_id} className="bg-[#1A0505]">
                  {formatCourseLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48 space-y-3">
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Cycle Segment</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
            >
              {Array.from({ length: (courseSemesters[selectedCourse] || 6) }, (_, i) => i + 1).map(s => (
                <option key={s} value={s} className="bg-[#1A0505]">Semester {s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating || !selectedCourse}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 disabled:opacity-20"
            >
              {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-[var(--gu-gold)]" />}
              Export PDF
            </button>

            <button
              onClick={fetchTimetable}
              className="bg-[var(--gu-gold)] text-black px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-[var(--gu-gold)]/10"
            >
              Sync Matrix
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[var(--gu-gold)]/10 animate-ping absolute inset-0"></div>
                <div className="w-20 h-20 rounded-full border-4 border-t-[var(--gu-gold)] animate-spin"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 animate-pulse">Initializing Temporal State...</span>
          </div>
        ) : selectedCourse ? (
          <div className="space-y-10 animate-fade-in">
            {/* The Matrix Grid */}
            <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
              {/* Internal Matrix Header */}
              <div className="bg-white/5 p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                   <h2 className="text-white font-serif text-3xl tracking-tight mb-2">
                     {(() => {
                       const c = courses.find(x => x.course_id === selectedCourse);
                       return c ? formatCourseLabel(c) : '';
                     })()}
                   </h2>
                   <div className="flex items-center gap-3 opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gu-gold)]">{shiftLabel}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">SEMESTER {selectedSemester}</span>
                   </div>
                </div>
                <div className={`px-6 py-2 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] ${
                  courseShift === "MORNING" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                }`}>
                   {courseShift} Configuration
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="py-8 px-6 text-center border-r border-white/5 w-40">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="w-5 h-5 text-white/20" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 leading-none">Clock Vector</span>
                        </div>
                      </th>
                      {days.map(day => (
                        <th key={day} className="py-8 px-6 text-center border-r border-white/5 last:border-0">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{day}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentSlots.map((slot, idx) => {
                      const isBreak = slot.label === "BREAK" || slot.label === "TEA" || slot.label === "LUNCH";
                      
                      if (isBreak) {
                        return (
                          <tr key={idx} className="bg-white/[0.01]">
                            <td className="py-6 px-6 text-center border-r border-white/5">
                              <span className="text-white/20 text-[10px] font-mono leading-none tracking-tighter">{formatTime12(slot.start)}</span>
                            </td>
                            {days.map(day => {
                              const isSatOff = day === "Saturday" && !isSaturdayOpenSlot(slot.label);
                              return (
                                <td key={day} className={`py-6 px-6 text-center border-r border-white/5 last:border-0 ${isSatOff ? 'bg-black/40' : ''}`}>
                                  {isSatOff ? (
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10">Null State</span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-4">
                                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[var(--gu-gold)]/10 to-transparent"></div>
                                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 flex items-center gap-3">
                                        {slot.label === "LUNCH" ? "🍽️ Lunch Intermission" : "☕ System Refresh"}
                                      </span>
                                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[var(--gu-gold)]/10 to-transparent"></div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }
                      
                      return (
                        <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-10 px-6 border-r border-white/5 w-40">
                            <div className="flex flex-col items-center gap-2">
                               <span className="text-[var(--gu-gold)] text-[9px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">{slot.label}</span>
                               <div className="flex flex-col items-center">
                                 <span className="text-white text-xs font-bold tracking-tight">{formatTime12(slot.start)}</span>
                                 <div className="w-1 h-1 rounded-full bg-white/10 my-1"></div>
                                 <span className="text-white/40 text-[10px] tracking-tighter">{formatTime12(slot.end)}</span>
                               </div>
                            </div>
                          </td>

                          {days.map(day => {
                            const isSatOff = day === "Saturday" && !isSaturdayOpenSlot(slot.label);
                            if (isSatOff) {
                              return (
                                <td key={day} className="p-4 border-r border-white/5 last:border-0 bg-black/40">
                                   <div className="h-28 rounded-2xl border border-dashed border-white/5 flex items-center justify-center">
                                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 -rotate-12">Recess</span>
                                   </div>
                                </td>
                              );
                            }

                            const data = getSlotContent(day, slot.start);
                            return (
                              <td key={day} className="p-3 border-r border-white/5 last:border-0 relative">
                                {data ? (
                                  <div className="h-28 bg-white/5 border border-white/5 group/card hover:border-[var(--gu-gold)]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-xl overflow-hidden relative">
                                    <div className="relative z-10 w-full overflow-hidden">
                                      <h4 className="text-white text-xs font-bold truncate tracking-tight mb-2 group-hover/card:text-[var(--gu-gold)] transition-colors leading-tight pr-4">
                                        {data.subject_name}
                                      </h4>
                                      <div className="flex flex-wrap gap-1.5 mb-3">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{data.subject_code}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/10 flex items-center gap-1">
                                          <MapPin className="w-2.5 h-2.5" /> {data.room}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-2 group-hover/card:translate-x-1 transition-transform">
                                       <div className="w-5 h-5 rounded-full bg-[var(--gu-gold)]/20 flex items-center justify-center border border-[var(--gu-gold)]/20 shadow-inner">
                                          <Users className="w-3 h-3 text-[var(--gu-gold)]" />
                                       </div>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover/card:text-white transition-colors truncate">{data.faculty_name}</span>
                                    </div>
                                    {/* Action Buttons Overlay */}
                                    <button
                                      onClick={() => handleDeleteSlot(data.slot_id)}
                                      className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500/40 rounded-xl border border-red-500/20 opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="absolute top-0 left-0 w-24 h-24 bg-[var(--gu-gold)]/5 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddSlot(day, slot)}
                                    className="w-full h-28 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 group/add hover:border-[var(--gu-gold)]/40 hover:bg-white/5 transition-all duration-300"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover/add:scale-110 group-hover/add:border-[var(--gu-gold)]/40 transition-all">
                                      <Plus className="w-4 h-4 text-white/10 group-hover/add:text-[var(--gu-gold)]" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 group-hover/add:text-white/40 transition-colors">Assign</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject Reference Matrix */}
            {Object.keys(subjectLegend).length > 0 && (
              <div className="glass-panel p-10 rounded-3xl border border-white/5 shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-white font-serif text-2xl tracking-tight">Curriculum Registry</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-4 py-2 rounded-full border border-white/5">{Object.keys(subjectLegend).length} Mapped Vectors</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(subjectLegend)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([code, fullName]) => (
                      <div key={code} className="group flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-[var(--gu-gold)]/20 transition-all duration-300">
                        <span className="w-16 h-10 rounded-xl bg-white/5 border border-white/10 text-[var(--gu-gold)] text-[10px] font-black flex items-center justify-center group-hover:bg-[var(--gu-gold)] group-hover:text-black transition-all">
                          {code}
                        </span>
                        <span className="text-white/60 text-[11px] font-bold tracking-tight leading-snug group-hover:text-white transition-colors">{fullName}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 animate-fade-in group">
            <div className="relative mb-8">
               <div className="w-24 h-24 bg-[var(--gu-gold)]/5 rounded-full flex items-center justify-center border border-[var(--gu-gold)]/10 group-hover:scale-110 transition-transform duration-1000">
                  <Calendar className="w-10 h-10 text-[var(--gu-gold)] opacity-20" />
               </div>
               <div className="absolute inset-0 bg-[var(--gu-gold)] blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-1000"></div>
            </div>
            <h2 className="text-3xl text-white font-serif mb-3 tracking-tight">Temporal Intelligence Interface</h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] max-w-md text-center leading-relaxed">
              Define academic track and lifecycle segment to initialize temporal matrix and schedule synchronization.
            </p>
          </div>
        )}

        {/* Action Modals */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="glass-panel border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div className="h-32 bg-gradient-to-r from-[var(--gu-red-deep)] via-purple-900/20 to-transparent relative overflow-hidden border-b border-white/5">
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                  <div className="absolute bottom-8 left-10">
                      <h3 className="text-2xl font-serif text-white tracking-tight">Assign Resource</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--gu-gold)] mt-1 opacity-60">Initializing Temporal Assignment</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:text-[var(--gu-gold)] transition-colors backdrop-blur-md">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
               </div>

               <div className="p-10 space-y-8">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Target Coordinates</p>
                        <p className="text-white text-xs font-bold">{activeSlot.day} <span className="text-white/20 mx-2">•</span> {formatTime12(activeSlot.slot.start)}</p>
                    </div>
                    <Clock className="w-5 h-5 text-[var(--gu-gold)] opacity-40" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Curriculum Vector</label>
                        <select
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#1A0505]">Select Subject Trace</option>
                          {subjects.map(s => (
                            <option key={s.subject_id} value={s.subject_id} className="bg-[#1A0505]">{s.name} ({s.code})</option>
                          ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Academic Personnel</label>
                            <select
                              required
                              value={formData.faculty}
                              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="" className="bg-[#1A0505]">Faculty Agent</option>
                              {faculty.map(f => (
                                <option key={f.faculty_id} value={f.faculty_id} className="bg-[#1A0505]">{f.name}</option>
                              ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Spatial Assignment</label>
                            <select
                              required
                              value={formData.room}
                              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="" className="bg-[#1A0505]">Room Coord</option>
                              {rooms
                                .filter(r => courseShift === "MORNING" ? (r.room_number.startsWith('C-') || r.room_number.includes('Lab')) : (r.room_number.startsWith('A-') || r.room_number.includes('Lab')))
                                .map(r => {
                                  const isUsed = timetableSlots.some(s => s.room === r.room_number && s.day_of_week === activeSlot?.day && (s.start_time || "").substring(0, 5) === (activeSlot?.slot?.start || ""));
                                  return (
                                    <option key={r.room_id} value={r.room_id} disabled={isUsed} className="bg-[#1A0505]">
                                      {r.room_number} {isUsed ? '(LOCK)' : ''}
                                    </option>
                                  );
                                })
                              }
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                       <button
                         type="button"
                         onClick={() => setShowModal(false)}
                         className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                       >
                         Abort Project
                       </button>
                       <button
                         type="submit"
                         className="flex-1 bg-[var(--gu-gold)] text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-[var(--gu-gold)]/10"
                       >
                         Commit Entry
                       </button>
                    </div>
                  </form>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--gu-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .vertical-text {
            writing-mode: vertical-rl;
            text-orientation: upright;
            letter-spacing: 0.1em;
        }
      `}</style>
    </AdminLayout>
  );
};

export default Timetable;
