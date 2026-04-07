import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Loader2,
  Filter, AlertCircle, BookOpen
} from 'lucide-react';
import { attendanceAI } from '../../services/api';

const SEVERITY_STYLES = {
  low:      { badge: 'bg-green-100 text-green-700 border border-green-200',   dot: 'bg-green-500'  },
  medium:   { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500' },
  high:     { badge: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  critical: { badge: 'bg-red-100 text-red-700 border border-red-200',          dot: 'bg-red-500'    },
};

const ANOMALY_LABELS = {
  low_percentage:     'Low Attendance %',
  consecutive_absent: 'Consecutive Absences',
  irregular_pattern:  'Irregular Pattern',
  sudden_drop:        'Sudden Drop',
};

export default function AttendanceAnomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Expanded descriptions
  const [expanded, setExpanded] = useState(new Set());

  // Resolving
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    fetchAnomalies();
  }, [severityFilter, subjectFilter]);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (subjectFilter) params.subject_id = subjectFilter;
      const res = await attendanceAI.getAnomalies(params);
      setAnomalies(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load anomalies.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResolve = async (anomalyId) => {
    setResolvingId(anomalyId);
    try {
      await attendanceAI.resolveAnomaly(anomalyId);
      setAnomalies(prev => prev.filter(a => a.id !== anomalyId));
    } catch {
      /* ignore */
    } finally {
      setResolvingId(null);
    }
  };

  const uniqueSubjects = [...new Set(anomalies.map(a => a.subject_code + '|' + a.subject_name))];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[var(--gu-red-dark)]">Attendance Anomalies</h1>
          <p className="text-gray-500 text-sm mt-1">AI-detected attendance issues with LLM-generated faculty alerts.</p>
        </div>
        {anomalies.length > 0 && (
          <span className="bg-red-100 text-red-600 border border-red-200 text-sm font-bold px-3 py-1.5 rounded-full">
            {anomalies.length} Active Alert{anomalies.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        {/* Severity filter */}
        <div className="relative">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)] bg-white">
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        {/* Subject filter */}
        {uniqueSubjects.length > 1 && (
          <div className="relative">
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)] bg-white">
              <option value="">All Subjects</option>
              {uniqueSubjects.map(s => {
                const [code, name] = s.split('|');
                return <option key={s} value={code}>{code} — {name}</option>;
              })}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        )}
        {(severityFilter || subjectFilter) && (
          <button onClick={() => { setSeverityFilter(''); setSubjectFilter(''); }}
            className="text-xs text-[var(--gu-red)] font-semibold hover:underline">
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--gu-red)] mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading anomalies...</p>
        </div>
      ) : anomalies.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-semibold text-gray-700 mb-1">No Active Anomalies</h3>
          <p className="text-gray-400 text-sm">All attendance patterns look healthy.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">Student</div>
            <div className="col-span-2">Subject</div>
            <div className="col-span-2">Anomaly Type</div>
            <div className="col-span-1">Severity</div>
            <div className="col-span-3">AI Description</div>
            <div className="col-span-1">Action</div>
          </div>

          {anomalies.map(a => {
            const sev = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.low;
            const isOpen = expanded.has(a.id);
            const short = a.description ? a.description.slice(0, 80) : null;
            const isTruncated = a.description?.length > 80;

            return (
              <div key={a.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Student */}
                  <div className="md:col-span-3">
                    <p className="text-sm font-semibold text-gray-800">{a.student_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.student_email}</p>
                  </div>

                  {/* Subject */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--gu-red)]" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{a.subject_code}</p>
                        <p className="text-[10px] text-gray-400">{a.subject_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Anomaly type */}
                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-600 font-medium">
                      {ANOMALY_LABELS[a.anomaly_type] || a.anomaly_type}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(a.detected_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Severity badge */}
                  <div className="md:col-span-1">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sev.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                      {a.severity}
                    </span>
                  </div>

                  {/* AI Description */}
                  <div className="md:col-span-3">
                    {a.description ? (
                      <div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {isOpen ? a.description : (short + (isTruncated ? '...' : ''))}
                        </p>
                        {isTruncated && (
                          <button onClick={() => toggleExpand(a.id)}
                            className="flex items-center gap-1 text-[10px] text-[var(--gu-red)] font-semibold mt-1 hover:underline">
                            {isOpen ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs">AI generating...</span>
                      </div>
                    )}
                  </div>

                  {/* Resolve */}
                  <div className="md:col-span-1">
                    <button id={`btn-resolve-${a.id}`}
                      onClick={() => handleResolve(a.id)}
                      disabled={resolvingId === a.id}
                      className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {resolvingId === a.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><CheckCircle className="w-3 h-3" /> Resolve</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
