import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { CheckCircle, AlertTriangle, XCircle, Loader2, Inbox } from "lucide-react";
import { studentAPI } from "../../services/api";

const Attendance = () => {
  const [tableData, setTableData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await studentAPI.attendance();
        if(res.data) {
          const data = res.data;
          setSummary({
            total: data.total_classes || 0,
            present: data.present || 0,
            absent: data.absent || 0,
            percentage: data.percentage || 0,
          });
          if (data.subject_breakdown && data.subject_breakdown.length > 0) {
            setTableData(data.subject_breakdown.map(s => ({
              sub: s.subject, total: s.total, att: s.present, miss: s.absent, pct: s.percentage,
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load attendance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // Dynamic banner logic
  const isAbove75 = summary.percentage >= 75;
  const isBetween65and75 = summary.percentage >= 65 && summary.percentage < 75;
  const hasData = summary.total > 0;

  const bannerConfig = isAbove75
    ? {
        bg: "bg-[rgba(74,222,128,0.1)]",
        border: "border-[#4ade80]",
        text: "text-[#4ade80]",
        icon: <CheckCircle className="text-[#4ade80] w-6 h-6 flex-shrink-0 mt-0.5" />,
        message: "Your attendance is above the required 75% threshold. Keep it up!",
      }
    : isBetween65and75
      ? {
          bg: "bg-[rgba(250,204,21,0.1)]",
          border: "border-yellow-400",
          text: "text-yellow-400",
          icon: <AlertTriangle className="text-yellow-400 w-6 h-6 flex-shrink-0 mt-0.5" />,
          message: "Warning! Your attendance is below 75%. Attend more classes to avoid detention.",
        }
      : {
          bg: "bg-[rgba(248,113,113,0.1)]",
          border: "border-[#f87171]",
          text: "text-[#f87171]",
          icon: <XCircle className="text-[#f87171] w-6 h-6 flex-shrink-0 mt-0.5" />,
          message: "Critical! Your attendance is dangerously low. You may face detention or exam debarment.",
        };

  const percentColor = isAbove75 ? "text-[#4ade80]" : isBetween65and75 ? "text-yellow-400" : "text-[#f87171]";

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[var(--gu-gold)] animate-spin" />
          <span className="text-white text-lg ml-3 animate-pulse">Loading attendance data...</span>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="relative">
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url(/maxresdefault.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.3,
          }}
        ></div>
        <div className="animate-fade-in relative z-10">
          {/* Page Header */}
          <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
            <h1 className="font-serif text-3xl text-white mb-2">
              Attendance Overview
            </h1>
            <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider font-semibold">
              AI Attendance System &middot; Real-Time Sync
            </p>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm box-border overflow-hidden">
              <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">
                Overall
              </span>
              <div className={`font-serif text-3xl md:text-4xl font-bold ${percentColor}`}>
                {summary.percentage}%
              </div>
            </div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm box-border overflow-hidden">
              <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">
                Classes Attended
              </span>
              <div className="font-serif text-3xl md:text-4xl text-[var(--gu-gold)] font-bold">
                {summary.present}
              </div>
            </div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm box-border overflow-hidden">
              <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">
                Classes Missed
              </span>
              <div className="font-serif text-3xl md:text-4xl text-[#f87171] font-bold">
                {summary.absent}
              </div>
            </div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm box-border overflow-hidden">
              <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">
                Total Sessions
              </span>
              <div className="font-serif text-3xl md:text-4xl text-white font-bold">
                {summary.total}
              </div>
            </div>
          </div>

          {/* Dynamic Warning Banner */}
          {hasData && (
            <div className={`${bannerConfig.bg} border ${bannerConfig.border} p-4 rounded-sm flex items-start gap-3 mb-8 leading-relaxed`}>
              {bannerConfig.icon}
              <p className={`${bannerConfig.text} font-medium text-sm md:text-base flex-1 word-wrap break-words`}>
                {bannerConfig.message}
              </p>
            </div>
          )}

          {/* No Data State */}
          {!hasData && (
            <div className="bg-white/5 border border-white/10 p-8 rounded-xl flex flex-col items-center justify-center gap-4 mb-8">
              <Inbox className="w-12 h-12 text-white/30" />
              <p className="text-white/50 text-center font-serif text-lg">
                No attendance records found yet.
              </p>
              <p className="text-white/30 text-center text-sm">
                Once your faculty starts a lecture session and you mark attendance via QR or face recognition, your records will appear here.
              </p>
            </div>
          )}

          {/* Subject-wise Table */}
          {hasData && (
            <>
              <h2 className="font-serif text-white text-xl mb-4">
                Subject-wise Breakdown
              </h2>
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden mb-12 overflow-x-auto w-full">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#3D0F0F] border-b border-[var(--gu-gold)]">
                      <th className="px-4 py-3 text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                        Total Classes
                      </th>
                      <th className="px-4 py-3 text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                        Attended
                      </th>
                      <th className="px-4 py-3 text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                        Missed
                      </th>
                      <th className="px-4 py-3 text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                        Percentage
                      </th>
                      <th className="px-4 py-3 text-white opacity-80 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => {
                      const isGreen = row.pct >= 75;
                      const isYellow = row.pct >= 65 && row.pct < 75;
                      const colorClass = isGreen
                        ? "text-[#4ade80]"
                        : isYellow
                          ? "text-yellow-400"
                          : "text-[#f87171]";

                      return (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-[var(--gu-red-card)]"
                              : "bg-[#3D0F0F]"
                          }
                        >
                          <td className="px-4 py-3 text-white font-medium text-sm word-wrap max-w-[200px]">
                            {row.sub}
                          </td>
                          <td className="px-4 py-3 text-white text-sm">
                            {row.total}
                          </td>
                          <td className="px-4 py-3 text-white text-sm">
                            {row.att}
                          </td>
                          <td className="px-4 py-3 text-white text-sm">
                            {row.miss}
                          </td>
                          <td
                            className={`px-4 py-3 font-bold text-sm ${colorClass}`}
                          >
                            {row.pct}%
                          </td>
                          <td className="px-4 py-3">
                            {isGreen && (
                              <span className="inline-flex items-center bg-[rgba(74,222,128,0.15)] text-[#4ade80] px-2 py-0.5 rounded-sm text-xs font-semibold whitespace-nowrap">
                                ✅ Safe
                              </span>
                            )}
                            {isYellow && (
                              <span className="inline-flex items-center bg-[rgba(250,204,21,0.15)] text-yellow-400 px-2 py-0.5 rounded-sm text-xs font-semibold whitespace-nowrap">
                                ⚠️ Low
                              </span>
                            )}
                            {!isGreen && !isYellow && (
                              <span className="inline-flex items-center bg-[rgba(248,113,113,0.15)] text-[#f87171] px-2 py-0.5 rounded-sm text-xs font-semibold whitespace-nowrap">
                                ❌ Critical
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Attendance;
