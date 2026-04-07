import { useState, useEffect } from "react";
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

const FacultyTimetable = () => {
    const [timetableSlots, setTimetableSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const timeSlots = [
        { label: "Slot 1", start: "13:25", end: "14:20" },
        { label: "Slot 2", start: "14:25", end: "15:20" },
        { label: "Slot 3", start: "15:25", end: "16:10" },
        { label: "LUNCH", start: "16:10", end: "16:30" },
        { label: "Slot 4", start: "16:35", end: "17:30" },
        { label: "Slot 5", start: "17:35", end: "18:25" },
    ];

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
            s.start_time.substring(0, 5) === startTime
        );
    };

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
                        className="bg-[rgba(212,175,55,0.1)] border border-[var(--gu-gold)] text-[var(--gu-gold)] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[rgba(212,175,55,0.2)] transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                        <Download className="w-4 h-4" /> Export Schedule
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm shadow-xl">
                        <table className="w-full border-collapse" id="faculty-timetable-print">
                            <thead>
                                <tr className="bg-[#3D0F0F] border-b border-[var(--gu-border)]">
                                    <th className="p-4 text-[var(--gu-gold)] text-left font-serif border-r border-[var(--gu-border)] w-28 text-xs uppercase tracking-widest">Time</th>
                                    {days.map(day => (
                                        <th key={day} className="p-3 text-white text-center font-serif min-w-[130px] border-r border-[var(--gu-border)] last:border-0 text-sm">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map((slot, idx) => (
                                    <tr key={idx} className="border-b border-[var(--gu-border)] last:border-0">
                                        <td className="bg-[#3D0F0F] p-3 border-r border-[var(--gu-border)]">
                                            <div className="text-white text-xs font-bold flex flex-col items-center">
                                                <Clock className="w-3.5 h-3.5 text-[var(--gu-gold)] mb-1" />
                                                {slot.start}
                                                <span className="text-white/30 text-[9px]">to</span>
                                                {slot.end}
                                                <span className="text-[8px] text-[var(--gu-gold)] uppercase mt-1 tracking-widest opacity-60">{slot.label}</span>
                                            </div>
                                        </td>

                                        {days.map(day => {
                                            const data = getSlotContent(day, slot.start);
                                            if (slot.label === "LUNCH") {
                                                return (
                                                    <td key={day} className="p-3 text-center bg-[rgba(212,175,55,0.03)] border-r border-[var(--gu-border)] last:border-0">
                                                        <span className="text-[var(--gu-gold)] text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">BREAK</span>
                                                    </td>
                                                );
                                            }
                                            return (
                                                <td key={day} className="p-2 border-r border-[var(--gu-border)] last:border-0">
                                                    {data ? (
                                                        <div className="bg-black/30 border-l-2 border-[var(--gu-gold)] p-2.5 rounded-r-sm">
                                                            <div className="text-[var(--gu-gold)] text-[11px] font-bold mb-1 leading-tight">{data.subject_name}</div>
                                                            <div className="text-white/80 text-[10px] font-bold mb-0.5">
                                                                {data.course_code} — Sem {data.semester}
                                                            </div>
                                                            <div className="text-white/50 text-[9px] mb-0.5">
                                                                Section {data.section}
                                                            </div>
                                                            <div className="text-white/50 text-[9px] flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1" /> Room {data.room}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-16 w-full flex items-center justify-center">
                                                            <span className="text-white/10 text-[9px] uppercase tracking-widest font-bold">Free</span>
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
                )}
            </div>
        </FacultyLayout>
    );
};

export default FacultyTimetable;
