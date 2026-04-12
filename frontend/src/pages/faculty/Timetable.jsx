import React, { useState, useEffect } from "react";
import FacultyLayout from "../../components/FacultyLayout";
import {
    Calendar,
    Clock,
    Users,
    BookOpen,
    MapPin,
    Download
} from "lucide-react";
import { facultyAPI } from "../../services/api";

// Helper: Convert 24h time string "HH:MM" to 12h format "H:MM AM/PM"
const formatTime12 = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const FacultyTimetable = () => {
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
            const res = await facultyAPI.timetable();
            setTimetableSlots(res.data);
        } catch (err) {
            console.error("Error fetching faculty timetable", err);
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
        <FacultyLayout>
            <div className="animate-fade-in">
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl text-white mb-2">Personal Teaching Schedule</h1>
                        <p className="text-[var(--gu-gold)] text-sm flex items-center uppercase tracking-wider font-semibold">
                            <Calendar className="w-4 h-4 mr-2" />
                            Weekly recurring timetable for assigned subjects
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="bg-[rgba(212,175,55,0.1)] border border-[var(--gu-gold)] text-[var(--gu-gold)] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[rgba(212,175,55,0.2)] transition-colors flex items-center gap-2 flex-shrink-0 rounded-md"
                    >
                        <Download className="w-4 h-4" /> Export Schedule
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto bg-[var(--gu-red-card)] border border-[var(--gu-gold)]/40 rounded-md shadow-xl">
                            <table className="w-full border-collapse" id="faculty-timetable-print">
                                <thead>
                                    <tr className="bg-gradient-to-b from-[#3D0F0F] to-[#2a0808] border-b-2 border-[var(--gu-gold)]/40">
                                        <th className="p-4 text-left font-serif border-r border-[var(--gu-gold)]/20 w-32">
                                            <div className="flex flex-col items-center gap-1">
                                                <Clock className="w-4 h-4 text-[var(--gu-gold)]" />
                                                <span className="text-[var(--gu-gold)] text-[10px] uppercase tracking-widest">Time</span>
                                            </div>
                                        </th>
                                        {days.map(day => (
                                            <th key={day} className="p-3 text-center font-serif min-w-[130px] border-r border-[var(--gu-gold)]/20 last:border-0">
                                                <span className="text-white text-sm font-bold">{day}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((slot, idx) => (
                                        <tr key={idx} className="border-b border-[var(--gu-gold)]/10 last:border-0 hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                                            <td className="bg-gradient-to-b from-[#3D0F0F] to-[#2a0808] p-3 border-r border-[var(--gu-gold)]/20">
                                                <div className="text-white text-xs font-bold flex flex-col items-center gap-0.5">
                                                    <span className="text-[var(--gu-gold)] text-[10px] font-bold uppercase tracking-wider">{slot.label}</span>
                                                    <span className="text-white text-xs font-semibold">{formatTime12(slot.start)}</span>
                                                    <span className="text-white/20 text-[8px]">to</span>
                                                    <span className="text-white/45 text-[10px]">{formatTime12(slot.end)}</span>
                                                </div>
                                            </td>

                                            {days.map(day => {
                                                const data = getSlotContent(day, slot.start);
                                                if (slot.label === "LUNCH") {
                                                    return (
                                                        <td key={day} className="p-3 text-center bg-gradient-to-r from-[rgba(212,175,55,0.03)] to-transparent border-r border-[var(--gu-gold)]/10 last:border-0">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[var(--gu-gold)] text-[10px] uppercase font-bold tracking-[0.2em] opacity-30">🍽️ BREAK</span>
                                                                <span className="text-white/20 text-[8px] mt-0.5">{formatTime12(slot.start)} – {formatTime12(slot.end)}</span>
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={day} className="p-1.5 border-r border-[var(--gu-gold)]/10 last:border-0">
                                                        {data ? (
                                                            <div className="bg-gradient-to-br from-black/50 to-black/20 border-l-[3px] border-l-[var(--gu-gold)] border border-white/5 p-2.5 rounded-md hover:border-[var(--gu-gold)]/30 transition-all duration-200 shadow-md">
                                                                <div className="text-[var(--gu-gold)] text-[11px] font-bold mb-1 leading-tight">{data.subject_name}</div>
                                                                {data.subject_code && (
                                                                    <div className="text-white/30 text-[8px] font-mono mb-1 bg-white/5 inline-block px-1.5 py-0.5 rounded">{data.subject_code}</div>
                                                                )}
                                                                <div className="text-white/70 text-[10px] font-bold mb-0.5">
                                                                    {data.course_code} — Sem {data.semester}
                                                                </div>
                                                                <div className="text-white/45 text-[9px] mb-0.5">
                                                                    Section {data.section}
                                                                </div>
                                                                <div className="text-white/45 text-[9px] flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" /> Room {data.room}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-[80px] w-full flex items-center justify-center">
                                                                <span className="text-white/8 text-[9px] uppercase tracking-widest font-bold">Free</span>
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
                            <div className="mt-6 bg-[var(--gu-red-card)] border border-[var(--gu-gold)]/30 rounded-md p-5 shadow-lg">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--gu-gold)]/15">
                                    <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
                                    <h3 className="text-white font-serif text-base">Subject Reference Guide</h3>
                                    <span className="text-white/30 text-xs ml-2">({Object.keys(subjectLegend).length} subjects)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {Object.entries(subjectLegend)
                                        .sort((a, b) => a[0].localeCompare(b[0]))
                                        .map(([code, fullName]) => (
                                            <div key={code} className="flex items-start gap-3 bg-black/30 border border-white/5 rounded-md px-3 py-2.5 hover:border-[var(--gu-gold)]/20 transition-colors">
                                                <span className="bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] text-[10px] font-mono font-bold px-2 py-1 rounded whitespace-nowrap border border-[var(--gu-gold)]/15">
                                                    {code}
                                                </span>
                                                <span className="text-white/70 text-xs leading-snug">{fullName}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </FacultyLayout>
    );
};

export default FacultyTimetable;
