import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { CheckCircle } from "lucide-react";
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
              Semester 6 &middot; B.Tech Computer Engineering
            </p>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm box-border overflow-hidden">
              <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">
                Overall
              </span>
              <div className="font-serif text-3xl md:text-4xl text-[#4ade80] font-bold">
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
                Minimum Required
              </span>
              <div className="font-serif text-3xl md:text-4xl text-white font-bold">
                75%
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-[rgba(74,222,128,0.1)] border border-[#4ade80] p-4 rounded-sm flex items-start gap-3 mb-8 leading-relaxed">
            <CheckCircle className="text-[#4ade80] w-6 h-6 flex-shrink-0 mt-0.5" />
            <p className="text-[#4ade80] font-medium text-sm md:text-base flex-1 word-wrap break-words">
              Your attendance is above the required 75% threshold. Keep it up!
            </p>
          </div>

          {/* Subject-wise Table */}
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
        </div>
      </div>
    </StudentLayout>
  );
};

export default Attendance;
