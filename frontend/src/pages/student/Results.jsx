import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import { Award, CheckCircle, Clock } from 'lucide-react';
import { studentAPI } from '../../services/api';

const DUMMY_RESULTS = {
    cgpa: 8.5,
    current_semester: 2,
    total_semesters: 6,
    semesters: [
        { semester: 1, sgpa: 8.2, status: "completed" },
        { semester: 2, sgpa: 8.8, status: "completed" },
        { semester: 3, sgpa: null, status: "remaining" },
        { semester: 4, sgpa: null, status: "remaining" },
        { semester: 5, sgpa: null, status: "remaining" },
        { semester: 6, sgpa: null, status: "remaining" }
    ]
};

const Results = () => {
    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await studentAPI.results();
                setResultsData(res.data);
            } catch {
                console.warn("Using dummy data - backend not available");
                setResultsData(DUMMY_RESULTS);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading || !resultsData) {
        return <StudentLayout><div className="flex items-center justify-center h-64"><p className="text-white text-lg animate-pulse">Loading results...</p></div></StudentLayout>;
    }

    return (
        <StudentLayout>
            <div className="relative">
                <div className="fixed inset-0 z-0" style={{ backgroundImage: "url(/maxresdefault.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", opacity: 0.3 }}></div>
                <div className="animate-fade-in max-w-5xl mx-auto relative z-10">
                    <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 word-wrap">
                        <h1 className="font-serif text-2xl md:text-3xl text-white mb-2 word-wrap break-words">Academic Results</h1>
                        <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold word-wrap break-words">Semester-wise Performance</p>
                    </div>

                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm mb-12 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 box-border shadow-lg">
                        <div className="flex items-center gap-4 z-10 w-full md:w-auto text-center md:text-left">
                            <div className="w-16 h-16 bg-[rgba(255,140,0,0.1)] rounded-full flex items-center justify-center mx-auto md:mx-0 border border-[#FF8C00]">
                                <Award className="w-8 h-8 text-[#FF8C00]" />
                            </div>
                            <div>
                                <h3 className="text-white opacity-80 text-sm md:text-base uppercase tracking-spaced font-semibold mb-1">Current CGPA</h3>
                                <div className="text-white opacity-50 text-xs">Out of 10.0</div>
                            </div>
                        </div>
                        <div className="z-10 text-center md:text-right w-full md:w-auto">
                            <div className="font-serif text-5xl md:text-6xl text-[#FF8C00] font-bold tracking-tight">
                                {parseFloat(resultsData.cgpa).toFixed(1)}
                            </div>
                        </div>
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#FF8C00]"></div>
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FF8C00] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                    </div>

                    <div>
                        <h2 className="font-serif text-white text-xl mb-6 border-l-3 border-[#FF8C00] pl-3">Semester Breakdown</h2>
                        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden overflow-x-auto box-border">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-[#3D0F0F] border-b border-[var(--gu-border)]">
                                        <th className="py-4 px-6 text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-widest font-semibold whitespace-nowrap">Semester</th>
                                        <th className="py-4 px-6 text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-widest font-semibold whitespace-nowrap text-center">SGPA</th>
                                        <th className="py-4 px-6 text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-widest font-semibold whitespace-nowrap text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultsData.semesters.map((sem) => (
                                        <tr key={sem.semester} className={`border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors ${sem.status === 'completed' ? '' : 'opacity-70'}`}>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center text-white font-serif text-base md:text-lg">Semester {sem.semester}</div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <div className={`font-bold text-lg md:text-xl ${sem.status === 'completed' ? 'text-white' : 'text-gray-500'}`}>
                                                    {sem.sgpa ? parseFloat(sem.sgpa).toFixed(1) : "—"}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right flex justify-end">
                                                {sem.status === 'completed' ? (
                                                    <div className="inline-flex items-center bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-sm whitespace-nowrap">
                                                        <CheckCircle className="w-3 h-3 mr-1.5" />Completed
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white/50 px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-sm whitespace-nowrap">
                                                        <Clock className="w-3 h-3 mr-1.5" />Remaining
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default Results;
