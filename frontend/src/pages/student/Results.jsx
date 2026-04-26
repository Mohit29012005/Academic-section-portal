import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import {
  Award, BookOpen, TrendingUp, Loader, AlertTriangle,
  ChevronRight, BarChart2, Target, GraduationCap, Star,
  CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { studentAPI } from '../../services/api';

const gradeColor = (grade) => {
  const map = {
    'O': 'text-emerald-400',
    'A+': 'text-green-400',
    'A': 'text-blue-400',
    'B+': 'text-cyan-400',
    'B': 'text-yellow-400',
    'C': 'text-orange-400',
    'P': 'text-amber-500',
    'F': 'text-red-500',
  };
  return map[grade] || 'text-white/40';
};

const gradeBg = (grade) => {
  const map = {
    'O': 'bg-emerald-500/15 border-emerald-500/30',
    'A+': 'bg-green-500/15 border-green-500/30',
    'A': 'bg-blue-500/15 border-blue-500/30',
    'B+': 'bg-cyan-500/15 border-cyan-500/30',
    'B': 'bg-yellow-500/15 border-yellow-500/30',
    'C': 'bg-orange-500/15 border-orange-500/30',
    'F': 'bg-red-500/15 border-red-500/30',
  };
  return map[grade] || 'bg-white/5 border-white/10';
};

const sgpaToWidth = (sgpa) => `${Math.min((sgpa / 10) * 100, 100)}%`;

const Results = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [expandedSem, setExpandedSem] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.results();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load results", err);
        setError("Failed to load result data from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getSemesterData = (sem) => data?.semesters?.find(s => s.semester === sem);
  const getHistorySemesters = () => {
    if (!selectedSemester || !data?.semesters) return [];
    return data.semesters.filter(s => s.semester <= selectedSemester).sort((a, b) => b.semester - a.semester);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--gu-gold)]/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-[var(--gu-gold)] animate-spin"></div>
              <div className="absolute inset-3 rounded-full border-r-2 border-red-400/60 animate-spin" style={{animationDirection:'reverse',animationDuration:'0.8s'}}></div>
            </div>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">Loading Academic Records...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4 text-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <p className="text-white/60">{error}</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const cgpa = data?.cgpa || 0;
  const completedSems = data?.dropdown_semesters?.length || 0;
  const currentSem = data?.current_semester || 1;
  const bestSem = data?.semesters?.reduce((best, s) => (!best || s.sgpa > best.sgpa) ? s : best, null);

  return (
    <StudentLayout>
      <div className="relative min-h-screen pb-12">

        {/* Background orbs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[var(--gu-gold)]/5 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] bg-purple-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-1">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="mb-8 pt-2">
            <p className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] mb-1 flex items-center gap-2">
              <Award className="w-3 h-3" /> Academic Records
            </p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight">Semester Results</h1>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <span className="font-bold text-white/60">{data?.student_name}</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span>{data?.enrollment_no}</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span>{data?.course_name}</span>
              </div>
            </div>
          </div>

          {/* ── Hero Stats Row ────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: <TrendingUp className="w-5 h-5" />,
                label: "Overall CGPA",
                val: cgpa.toFixed ? cgpa.toFixed(2) : cgpa,
                sub: "Cumulative Grade",
                color: "from-[var(--gu-gold)]/20 to-yellow-600/5",
                border: "border-[var(--gu-gold)]/25",
                iconColor: "text-[var(--gu-gold)]",
              },
              {
                icon: <BookOpen className="w-5 h-5" />,
                label: "Current Semester",
                val: currentSem,
                sub: `of ${data?.total_semesters || 8} total`,
                color: "from-blue-500/20 to-blue-600/5",
                border: "border-blue-500/25",
                iconColor: "text-blue-400",
              },
              {
                icon: <GraduationCap className="w-5 h-5" />,
                label: "Semesters Done",
                val: completedSems,
                sub: "Results Available",
                color: "from-emerald-500/20 to-green-600/5",
                border: "border-emerald-500/25",
                iconColor: "text-emerald-400",
              },
              {
                icon: <Star className="w-5 h-5" />,
                label: "Best SGPA",
                val: bestSem ? bestSem.sgpa.toFixed(2) : "—",
                sub: bestSem ? `Semester ${bestSem.semester}` : "No data yet",
                color: "from-purple-500/20 to-purple-600/5",
                border: "border-purple-500/25",
                iconColor: "text-purple-400",
              },
            ].map((stat, i) => (
              <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 hover:-translate-y-0.5 transition-transform shadow-lg`}>
                <div className={`${stat.iconColor} mb-3`}>{stat.icon}</div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-white text-3xl font-black mb-0.5">{stat.val}</p>
                <p className="text-white/35 text-[10px] font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── SGPA Progress Bars ───────────────────────────── */}
          {data?.semesters && data.semesters.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#1e0505]/80 to-[#130303]/80 backdrop-blur-xl p-7 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart2 className="w-5 h-5 text-[var(--gu-gold)]" />
                <h2 className="text-white font-bold text-lg">SGPA Performance Track</h2>
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-white/30">/ 10.0</span>
              </div>
              <div className="space-y-4">
                {[...data.semesters].sort((a,b) => a.semester - b.semester).map(sem => (
                  <div key={sem.semester} className="flex items-center gap-4 group">
                    <button
                      onClick={() => { setSelectedSemester(sem.semester); setExpandedSem(sem.semester); }}
                      className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/8 bg-white/5 flex items-center justify-center text-xs font-black text-white/60 hover:bg-[var(--gu-gold)]/20 hover:border-[var(--gu-gold)]/30 hover:text-[var(--gu-gold)] transition-all"
                    >
                      S{sem.semester}
                    </button>
                    <div className="flex-1 relative">
                      <div className="h-2 rounded-full bg-white/6 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--gu-gold)] to-yellow-400 transition-all duration-700 delay-75"
                          style={{ width: sgpaToWidth(sem.sgpa) }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right min-w-[80px]">
                      <span className="text-white font-black text-sm">{sem.sgpa.toFixed(2)}</span>
                      <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-md border ${gradeBg(sem.grade)} ${gradeColor(sem.grade)}`}>
                        {sem.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Semester Selector ────────────────────────────── */}
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#1e0505]/80 to-[#130303]/80 backdrop-blur-xl p-7 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-[var(--gu-gold)]" />
              <h2 className="text-white font-bold text-lg">Detailed Results</h2>
            </div>

            {currentSem === 1 && completedSems === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-white/15" />
                <p className="text-white/40 text-sm font-semibold">First semester in progress</p>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mt-1">Results will appear after your first semester</p>
              </div>
            ) : (
              <>
                {/* Semester pill buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {data?.dropdown_semesters?.map(sem => {
                    const semData = getSemesterData(sem);
                    const isSelected = selectedSemester === sem;
                    return (
                      <button
                        key={sem}
                        onClick={() => { setSelectedSemester(sem); setExpandedSem(sem); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                          isSelected
                            ? 'bg-[var(--gu-gold)] border-[var(--gu-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                            : 'bg-white/5 border-white/8 text-white/60 hover:bg-white/10 hover:border-white/15'
                        }`}
                      >
                        Sem {sem}
                        {semData && <span className={`ml-1.5 ${isSelected ? 'text-black/60' : gradeColor(semData.grade)}`}>{semData.sgpa?.toFixed(1)}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed accordion */}
                {selectedSemester && (
                  <div className="space-y-3">
                    {getHistorySemesters().map(semResult => {
                      const isExpanded = expandedSem === semResult.semester;
                      return (
                        <div key={semResult.semester} className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? 'border-[var(--gu-gold)]/30' : 'border-white/8'}`}>
                          <button
                            onClick={() => setExpandedSem(isExpanded ? null : semResult.semester)}
                            className={`w-full p-5 flex items-center justify-between transition-colors ${isExpanded ? 'bg-[var(--gu-gold)]/8' : 'bg-white/3 hover:bg-white/5'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border transition-all ${
                                isExpanded ? 'bg-[var(--gu-gold)]/20 border-[var(--gu-gold)]/40 text-[var(--gu-gold)]' : 'bg-white/5 border-white/10 text-white/60'
                              }`}>
                                {semResult.semester}
                              </div>
                              <div className="text-left">
                                <h3 className="text-white font-bold text-sm">Semester {semResult.semester}</h3>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[10px] text-white/40">SGPA: <span className="text-[var(--gu-gold)] font-black">{semResult.sgpa?.toFixed(2)}</span></span>
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${gradeBg(semResult.grade)} ${gradeColor(semResult.grade)}`}>{semResult.grade}</span>
                                  <span className="text-[10px] text-white/30">{semResult.percentage?.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--gu-gold)]" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                          </button>

                          {isExpanded && (
                            <div className="border-t border-[var(--gu-gold)]/15">
                              {semResult.subject_results && semResult.subject_results.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[680px]">
                                    <thead>
                                      <tr className="bg-white/3">
                                        {['Subject', 'Code', 'Internal', 'External', 'Practical', 'Total', 'Grade', 'Status'].map(h => (
                                          <th key={h} className="py-3 px-5 text-left text-[10px] font-black uppercase tracking-widest text-white/35">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/4">
                                      {semResult.subject_results.map((sr, i) => (
                                        <tr key={i} className="hover:bg-white/3 transition-colors">
                                          <td className="py-3.5 px-5 text-white text-xs font-semibold">{sr.subject_name}</td>
                                          <td className="py-3.5 px-5 text-white/35 text-[10px] font-mono bg-white/2">{sr.subject_code}</td>
                                          <td className="py-3.5 px-5 text-white/55 text-xs">{sr.internal_marks}</td>
                                          <td className="py-3.5 px-5 text-white/55 text-xs">{sr.external_marks}</td>
                                          <td className="py-3.5 px-5 text-white/55 text-xs">{sr.practical_marks || 0}</td>
                                          <td className="py-3.5 px-5 text-white font-bold text-xs">{sr.total_marks}</td>
                                          <td className={`py-3.5 px-5 text-xs font-black ${gradeColor(sr.grade)}`}>{sr.grade}</td>
                                          <td className="py-3.5 px-5">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                              sr.is_passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                                            }`}>
                                              {sr.is_passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                              {sr.is_passed ? 'Pass' : 'Fail'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-center py-8 text-white/25 text-sm italic">No subject data available</p>
                              )}

                              {/* Footer */}
                              <div className="px-5 py-4 bg-white/2 border-t border-white/5 flex flex-wrap gap-6 text-xs">
                                <span className="text-white/40">Marks: <strong className="text-white">{semResult.obtained_marks}/{semResult.total_marks}</strong></span>
                                <span className="text-white/40">Percentage: <strong className="text-white">{semResult.percentage?.toFixed(2)}%</strong></span>
                                <span className="text-white/40">SGPA: <strong className="text-[var(--gu-gold)]">{semResult.sgpa?.toFixed(2)}</strong></span>
                                <span className="text-white/40">Exam: <strong className="text-white/60">{semResult.exam_type || 'Regular'}</strong></span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Results;
