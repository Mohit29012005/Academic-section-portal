import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Download,
  Info
} from "lucide-react";
import { studentAPI } from "../../services/api";

const StudentTimetable = () => {
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
            s.start_time.substring(0, 5) === startTime
        );
    };

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
                            className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-yellow-500 transition-all flex items-center gap-2 rounded-sm flex-shrink-0"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>

                    <div className="bg-black/40 p-4 border-l-4 border-[var(--gu-gold)] mb-6 flex items-start gap-3 rounded-sm">
                        <Info className="w-5 h-5 text-[var(--gu-gold)] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white text-sm font-bold">Standard Timing Protocol</p>
                            <p className="text-white/60 text-xs mt-1">Schedule: 1:25 PM – 6:25 PM · 55-min lectures · 20-min lunch at 4:10 PM</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gu-gold)]"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-[var(--gu-red-card)] border border-[var(--gu-border)] shadow-xl rounded-sm">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#3D0F0F] border-b border-[var(--gu-border)]">
                                        <th className="p-4 text-[var(--gu-gold)] text-left font-serif border-r border-[var(--gu-border)] w-28 text-xs uppercase tracking-widest">Timing</th>
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
                                                    <div className="text-[var(--gu-gold)]">{slot.start}</div>
                                                    <div className="w-px h-2 bg-white/20 my-0.5"></div>
                                                    <div className="text-white/40">{slot.end}</div>
                                                    <span className="text-[8px] text-[var(--gu-gold)] uppercase mt-1 tracking-widest opacity-60">{slot.label}</span>
                                                </div>
                                            </td>
                                            
                                            {days.map(day => {
                                                const data = getSlotContent(day, slot.start);
                                                if (slot.label === "LUNCH") {
                                                    return (
                                                        <td key={day} className="p-3 text-center bg-black/20 border-r border-[var(--gu-border)] last:border-0">
                                                            <span className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-30">LUNCH</span>
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={day} className="p-2 border-r border-[var(--gu-border)] last:border-0">
                                                        {data ? (
                                                            <div className="bg-black/30 border-l-2 border-[var(--gu-gold)] p-2.5 rounded-r-sm">
                                                                <div className="text-white text-[11px] font-bold mb-1 leading-tight border-l-0">{data.subject_name}</div>
                                                                <div className="text-white/60 text-[10px] flex items-center mb-0.5">
                                                                    <Users className="w-3 h-3 mr-1 opacity-50" /> {data.faculty_name}
                                                                </div>
                                                                <div className="text-white/60 text-[10px] flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1 opacity-50" /> {data.room}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-16 w-full flex items-center justify-center">
                                                                <Clock className="w-4 h-4 text-white/10" />
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
            </div>
        </StudentLayout>
    );
};

export default StudentTimetable;
