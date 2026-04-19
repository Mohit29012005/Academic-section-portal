import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Download,
  Info,
  BookOpen
} from "lucide-react";
import { studentAPI } from "../../services/api";

// Helper: Convert 24h time string "HH:MM" to 12h format "H:MM AM/PM"
const formatTime12 = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const StudentTimetable = () => {
    const [timetableSlots, setTimetableSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const timeSlots = React.useMemo(() => {
        if (timetableSlots.length === 0) {
            return [
                { label: "Slot 1", start: "13:25", end: "14:20" },
                { label: "Slot 2", start: "14:20", end: "15:15" },
                { label: "Slot 3", start: "15:15", end: "16:10" },
                { label: "LUNCH", start: "16:10", end: "16:30" },
                { label: "Slot 4", start: "16:30", end: "17:20" },
                { label: "Slot 5", start: "17:20", end: "18:10" },
            ];
        }
        
        const uniqueTimes = [...new Set(timetableSlots.map(s => s.start_time.substring(0, 5)))].sort();
        return uniqueTimes.map((time, idx) => ({
            label: time === "16:10" ? "LUNCH" : `Slot ${idx + 1}`,
            start: time,
            end: timetableSlots.find(s => s.start_time.substring(0, 5) === time)?.end_time?.substring(0, 5) || ""
        }));
    }, [timetableSlots]);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        setLoading(true);
        try {
            const res = await studentAPI.timetable();
            setTimetableSlots(res.data);
        } catch (err) {
            console.error("Error fetching student timetable", err);
        } finally {
            setLoading(false);
        }
    };

    const getSlotContent = (day, startTime) => {
        return timetableSlots.find(s => 
            s.day_of_week === day && 
            s.start_time && s.start_time.substring(0, 5) === startTime
        );
    };

    // Build subject legend from timetable data
    const subjectLegend = {};
    timetableSlots.forEach(slot => {
        if (slot.subject_code && slot.subject_name) {
            subjectLegend[slot.subject_code] = slot.subject_name;
        }
    });

    return (
        <StudentLayout>
            <div className="relative">
                <div className="fixed inset-0 z-0" style={{ backgroundImage: "url(/maxresdefault.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", opacity: 0.3 }}></div>
                <div className="animate-fade-in relative z-10">
                    <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-3xl text-white mb-2">Class Schedule</h1>
                            <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider font-semibold flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Weekly Timetable — Ganpat University
                            </p>
                        </div>
                        <button 
                            onClick={() => window.print()}
                            className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-yellow-500 transition-all flex items-center gap-2 rounded-md flex-shrink-0"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>

                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 border-l-4 border-l-[var(--gu-gold)] mb-6 flex items-start gap-3 rounded-sm box-border">
                        <Info className="w-5 h-5 text-[var(--gu-gold)] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white text-sm font-bold">Standard Timing Protocol</p>
                            <p className="text-white/60 text-xs mt-1">Schedule: {formatTime12("13:25")} – {formatTime12("18:25")} · 55-min lectures · 20-min lunch at {formatTime12("16:10")}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
                        </div>
                    ) : timetableSlots.length === 0 ? (
                        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-12 flex flex-col items-center justify-center rounded-sm">
                            <Calendar className="w-16 h-16 text-white/20 mb-4" />
                            <h2 className="text-2xl font-serif text-white mb-2">No Schedule Found</h2>
                            <p className="text-white/40 text-center max-w-md text-sm">
                                Your timetable is currently empty. This typically occurs because your admin hasn't generated the schedule yet, or you are currently in your final Industry Project / Internship semester which has no active lectures.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#3D0F0F] border-b border-[var(--gu-gold)]">
                                            <th className="p-4 text-left font-serif border-r border-[var(--gu-border)] w-32">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Clock className="w-4 h-4 text-white opacity-60" />
                                                    <span className="text-white opacity-80 text-[10px] uppercase tracking-widest font-semibold">Timing</span>
                                                </div>
                                            </th>
                                            {days.map(day => (
                                                <th key={day} className="p-3 text-center border-r border-[var(--gu-border)] last:border-0">
                                                    <span className="text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">{day}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map((slot, idx) => (
                                            <tr key={idx} className={`${idx % 2 === 0 ? "bg-[var(--gu-red-card)]" : "bg-[#3D0F0F]"} border-b border-[var(--gu-border)] last:border-0`}>
                                                <td className="p-3 border-r border-[var(--gu-border)]">
                                                    <div className="text-white text-xs font-bold flex flex-col items-center gap-0.5">
                                                        <span className="text-[var(--gu-gold)] text-[10px] font-bold uppercase tracking-wider">{slot.label}</span>
                                                        <span className="text-white text-xs font-semibold">{formatTime12(slot.start)}</span>
                                                        <span className="text-white/40 text-[8px]">to</span>
                                                        <span className="text-white/60 text-[10px]">{formatTime12(slot.end)}</span>
                                                    </div>
                                                </td>
                                                
                                                {days.map(day => {
                                                    const data = getSlotContent(day, slot.start);
                                                    if (slot.label === "LUNCH") {
                                                        return (
                                                            <td key={day} className="p-3 text-center border-r border-[var(--gu-border)] last:border-0">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-white/30 text-[10px] uppercase font-black tracking-widest">🍽️ LUNCH</span>
                                                                    <span className="text-white/20 text-[8px] mt-0.5">{formatTime12(slot.start)} – {formatTime12(slot.end)}</span>
                                                                </div>
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td key={day} className="p-1.5 border-r border-[var(--gu-border)] last:border-0">
                                                            {data ? (
                                                                <div className="bg-[#4d1313] border-l-4 border-l-[var(--gu-gold)] border border-[var(--gu-border)] p-2.5 hover:border-[var(--gu-gold)] transition-all duration-200">
                                                                    <div className="text-white text-[11px] font-bold mb-1 leading-tight">{data.subject_name}</div>
                                                                    {data.subject_code && (
                                                                        <div className="text-white/30 text-[8px] font-mono mb-1 bg-white/5 inline-block px-1.5 py-0.5 rounded">{data.subject_code}</div>
                                                                    )}
                                                                    <div className="text-white/55 text-[10px] flex items-center mb-0.5">
                                                                        <Users className="w-3 h-3 mr-1 opacity-50 flex-shrink-0" /> <span className="truncate">{data.faculty_name}</span>
                                                                    </div>
                                                                    <div className="text-white/55 text-[10px] flex items-center">
                                                                        <MapPin className="w-3 h-3 mr-1 opacity-50 flex-shrink-0" /> {data.room}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-[76px] w-full flex items-center justify-center">
                                                                    <Clock className="w-4 h-4 text-white/8" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ═══════ Subject Legend ═══════ */}
                            {Object.keys(subjectLegend).length > 0 && (
                                <div className="mt-6 bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6 box-border">
                                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--gu-gold)]">
                                        <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
                                        <h3 className="text-white font-serif text-lg">Subject Reference Guide</h3>
                                        <span className="text-white/40 text-xs ml-2">({Object.keys(subjectLegend).length} subjects)</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(subjectLegend)
                                            .sort((a, b) => a[0].localeCompare(b[0]))
                                            .map(([code, fullName]) => (
                                                <div key={code} className="flex items-start gap-3 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm px-4 py-3 hover:bg-[#4d1313] transition-colors">
                                                    <span className="bg-[#4a1212] text-white text-[10px] font-mono font-bold px-2 py-1 rounded-sm whitespace-nowrap border border-[var(--gu-border)]">
                                                        {code}
                                                    </span>
                                                    <span className="text-white/80 text-xs leading-snug">{fullName}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentTimetable;
