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
      <div className="animate-fade-in">
        {/* Header - GANPAT DCS Format */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif text-white tracking-wide">DCS Timetable Manager</h1>
            <p className="text-[var(--gu-gold)] text-sm mt-1 flex items-center opacity-80">
              <Calendar className="w-4 h-4 mr-2" />
              Ganpat University - Department of Computer Science
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
                onChange={(e) => { setSelectedCourse(e.target.value); setSelectedSemester("1"); }}
                className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 focus:border-[var(--gu-gold)] outline-none transition-colors"
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.course_id} value={c.course_id}>
                    {formatCourseLabel(c)}
                  </option>
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
                {Array.from({ length: (courseSemesters[selectedCourse] || 6) }, (_, i) => i + 1).map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating || !selectedCourse}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              title="Download Timetable PDF"
            >
              {pdfGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>

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
          <>
            <div className="overflow-x-auto bg-[var(--gu-red-card)] border border-[var(--gu-gold)] shadow-2xl mt-6 rounded-md">
              {/* GANPAT DCS Header with Shift Info */}
              <div className="bg-gradient-to-r from-[var(--gu-red-deep)] via-[#4a0e0e] to-[var(--gu-red-deep)] p-5 text-center border-b-2 border-[var(--gu-gold)]">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <h2 className="text-xl font-serif text-white tracking-wide">
                    {(() => {
                      const c = courses.find(x => x.course_id === selectedCourse);
                      return c ? formatCourseLabel(c) : '';
                    })()}
                  </h2>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    courseShift === "MORNING" ? "bg-blue-600/80 text-white" : "bg-orange-600/80 text-white"
                  }`}>
                    {courseShift === "MORNING" ? "☀️ MORNING SHIFT" : "🌤️ NOON SHIFT"}
                  </span>
                </div>
                <p className="text-[var(--gu-gold)] text-sm font-medium">
                  Ganpat University | Department of Computer Science | Semester {selectedSemester}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  {shiftLabel} | {shiftCourses}
                </p>
              </div>
              
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-b from-[#3D0F0F] to-[#2a0808]">
                    <th className="p-3 text-center font-serif border-r border-[rgba(212,175,55,0.3)] w-32">
                      <div className="flex flex-col items-center gap-1">
                        <Clock className="w-4 h-4 text-[var(--gu-gold)]" />
                        <span className="text-[var(--gu-gold)] text-xs uppercase tracking-widest">Time</span>
                      </div>
                    </th>
                    {days.map(day => (
                      <th key={day} className="p-3 text-center font-serif min-w-[130px] border-r border-[rgba(212,175,55,0.3)] last:border-0">
                        <span className="text-white text-sm font-bold">{day}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSlots.map((slot, idx) => {
                    // Handle breaks differently based on shift
                    const isLunchBreak = slot.label === "LUNCH";
                    const isTeaBreak = slot.label === "BREAK" || slot.label === "TEA";
                    
                    if (isLunchBreak || isTeaBreak) {
                      return (
                        <tr key={idx} className="border-b border-[rgba(212,175,55,0.15)]">
                          <td className="p-2 text-center bg-gradient-to-b from-[#3D0F0F] to-[#2a0808] border-r border-[rgba(212,175,55,0.3)]">
                            <span className="text-white/60 text-[10px] font-semibold">{formatTime12(slot.start)}</span>
                          </td>
                          {days.map(day => {
                            const isSaturdayClosed = day === "Saturday" && !isSaturdayOpenSlot(slot.label);
                            if (isSaturdayClosed) {
                              return (
                                <td key={day} className="p-2 text-center border-r border-[rgba(212,175,55,0.15)] last:border-0 bg-black/20">
                                  <div className="flex flex-col items-center justify-center py-1.5">
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/45">Half Day Off</span>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={day} className="p-2 text-center border-r border-[rgba(212,175,55,0.15)] last:border-0 bg-gradient-to-r from-[rgba(212,175,55,0.03)] to-transparent">
                                <div className="flex flex-col items-center justify-center py-1.5">
                                  <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isLunchBreak ? "text-red-400/80" : "text-amber-400/80"}`}>
                                    {isLunchBreak ? "🍽️ LUNCH BREAK" : "☕ TEA BREAK"}
                                  </span>
                                  <span className="text-white/30 text-[9px] mt-0.5">{formatTime12(slot.start)} – {formatTime12(slot.end)}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }
                    
                    return (
                      <tr key={idx} className="border-b border-[rgba(212,175,55,0.1)] last:border-0 hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                        <td className="bg-gradient-to-b from-[#3D0F0F] to-[#2a0808] p-3 border-r border-[rgba(212,175,55,0.3)] w-32">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[var(--gu-gold)] text-[10px] font-bold uppercase tracking-wider">{slot.label}</span>
                            <div className="flex flex-col items-center">
                              <span className="text-white text-xs font-semibold">{formatTime12(slot.start)}</span>
                              <span className="text-white/25 text-[8px]">to</span>
                              <span className="text-white/50 text-[10px]">{formatTime12(slot.end)}</span>
                            </div>
                          </div>
                        </td>

                        {days.map(day => {
                          const isSaturdayClosed = day === "Saturday" && !isSaturdayOpenSlot(slot.label);
                          if (isSaturdayClosed) {
                            return (
                              <td key={day} className="p-1.5 border-r border-[rgba(212,175,55,0.1)] last:border-0 min-h-[80px] bg-black/20">
                                <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-md">
                                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/45">Half Day Off</span>
                                </div>
                              </td>
                            );
                          }

                          const data = getSlotContent(day, slot.start);
                          return (
                            <td key={day} className="p-1.5 border-r border-[rgba(212,175,55,0.1)] last:border-0 group relative min-h-[80px]">
                              {data ? (
                                <div className="h-full bg-gradient-to-br from-black/60 to-black/30 border border-[rgba(212,175,55,0.3)] p-2.5 rounded-md flex flex-col justify-between shadow-lg hover:border-[var(--gu-gold)] transition-all duration-200">
                                  <div>
                                    <div className="text-[var(--gu-gold)] text-xs font-bold mb-1.5 line-clamp-2 leading-tight">{data.subject_name}</div>
                                    {data.subject_code && (
                                      <div className="text-white/40 text-[9px] font-mono mb-1 bg-white/5 inline-block px-1.5 py-0.5 rounded">{data.subject_code}</div>
                                    )}
                                    <div className="text-white/60 text-[10px] flex items-center mb-0.5">
                                      <Users className="w-3 h-3 mr-1 flex-shrink-0" /> <span className="truncate">{data.faculty_name}</span>
                                    </div>
                                    <div className="text-white/60 text-[10px] flex items-center">
                                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" /> {data.room || 'N/A'}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSlot(data.slot_id)}
                                    className="absolute top-1.5 right-1.5 p-1 bg-red-900/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddSlot(day, slot)}
                                  className="w-full h-full min-h-[80px] flex flex-col items-center justify-center text-white/15 hover:text-[var(--gu-gold)] hover:bg-[rgba(212,175,55,0.04)] transition-all duration-200 border border-dashed border-white/5 hover:border-[var(--gu-gold)]/50 rounded-md"
                                >
                                  <Plus className="w-4 h-4 mb-0.5" />
                                  <span className="text-[8px] uppercase font-bold tracking-widest">Add</span>
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
              
              {/* Footer with Shift Info (12h format) */}
              <div className="bg-gradient-to-r from-[var(--gu-red-deep)] via-[#4a0e0e] to-[var(--gu-red-deep)] p-3 text-center text-white/40 text-xs border-t-2 border-[var(--gu-gold)]">
                {courseShift === "MORNING" 
                  ? `Morning Shift: ${formatTime12("08:00")} - ${formatTime12("12:55")} | Tea Break: ${formatTime12("09:40")} - ${formatTime12("10:15")} | Saturday Half Day: Slot 1-3`
                  : `Noon Shift: ${formatTime12("12:00")} - ${formatTime12("18:10")} | Break: ${formatTime12("12:55")} - ${formatTime12("13:25")} | Lunch: ${formatTime12("14:20")} - ${formatTime12("15:15")} | Tea: ${formatTime12("16:10")} - ${formatTime12("16:30")} | Saturday Half Day: Slot 1-3`
                }
              </div>
            </div>

            {/* ═══════ Subject Legend ═══════ */}
            {Object.keys(subjectLegend).length > 0 && (
              <div className="mt-6 bg-[var(--gu-red-card)] border border-[var(--gu-gold)]/40 rounded-md p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--gu-gold)]/20">
                  <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
                  <h3 className="text-white font-serif text-lg">Subject Reference Guide</h3>
                  <span className="text-white/40 text-xs ml-2">({Object.keys(subjectLegend).length} subjects)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(subjectLegend)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([code, fullName]) => (
                      <div key={code} className="flex items-start gap-3 bg-black/30 border border-white/5 rounded-md px-4 py-3 hover:border-[var(--gu-gold)]/30 transition-colors">
                        <span className="bg-[var(--gu-gold)]/15 text-[var(--gu-gold)] text-xs font-mono font-bold px-2.5 py-1 rounded-md whitespace-nowrap border border-[var(--gu-gold)]/20">
                          {code}
                        </span>
                        <span className="text-white/80 text-sm leading-snug">{fullName}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-[var(--gu-red-card)] border border-[var(--gu-gold)] text-center mt-6 rounded-md">
            <Calendar className="w-16 h-16 text-[var(--gu-gold)] opacity-30 mb-4" />
            <h2 className="text-2xl text-white font-serif mb-2">DCS Timetable Manager</h2>
            <p className="text-white/60 max-w-md mx-auto mb-4">
              Ganpat University - Department of Computer Science<br/>
              {shiftLabel}
            </p>
            <p className="text-white/40 text-sm">Select a Program and Semester to manage timetable</p>
          </div>
        )}

        {/* Add Slot Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--gu-red-card)] border-2 border-[var(--gu-gold)] w-full max-w-md shadow-2xl p-6 rounded-md">
              <div className="flex items-center justify-between mb-6 border-b border-[var(--gu-gold)] pb-4">
                <h3 className="text-xl font-serif text-[var(--gu-gold)]">Assign New Class</h3>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="mb-4 bg-black/40 p-3 flex items-center justify-between border border-white/5 rounded-md">
                <div className="text-xs text-white/60 uppercase tracking-widest">Selected Slot</div>
                <div className="text-sm text-[var(--gu-gold)] font-bold">{activeSlot.day}, {formatTime12(activeSlot.slot.start)} – {formatTime12(activeSlot.slot.end)}</div>
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
                  <label className="text-white text-[10px] uppercase tracking-widest opacity-70">Room No.</label>
                  <select
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full bg-black border border-[var(--gu-border-red)] text-white px-3 py-2 outline-none focus:border-[var(--gu-gold)]"
                  >
                    <option value="">Select Room</option>
                    {rooms
                      .filter(r => {
                        // Filter rooms by shift (Morning = C-xxx, Noon = A-xxx)
                        if (courseShift === "MORNING") {
                          return r.room_number.startsWith('C-') || r.room_number.includes('Lab');
                        } else {
                          return r.room_number.startsWith('A-') || r.room_number.includes('Lab');
                        }
                      })
                      .map(r => {
                        // Check if room is already used in this slot
                        const isUsed = timetableSlots.some(s => 
                          s.room === r.room_number && 
                          s.day_of_week === activeSlot?.day &&
                          (s.start_time || "").substring(0, 5) === (activeSlot?.slot?.start || "")
                        );
                        return (
                          <option key={r.room_id} value={r.room_id} disabled={isUsed}>
                            {r.room_number} ({r.room_type}){isUsed ? ' - IN USE' : ''}
                          </option>
                        );
                      })
                    }
                  </select>
                  <p className="text-xs text-white/40 mt-1">
                    Rooms showing "IN USE" are already assigned for this day and time slot
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-[var(--gu-gold)] text-white hover:bg-[rgba(212,175,55,0.1)] transition-colors rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-8 py-2 font-bold hover:bg-yellow-500 transition-colors rounded-md"
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
