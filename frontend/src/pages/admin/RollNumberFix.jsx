import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Hash, AlertTriangle, CheckCircle, RefreshCw, Loader } from 'lucide-react';
import { superAdminAPI } from '../../services/api';

const RollNumberFix = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fixing, setFixing] = useState(false);

  const checkRollNumbers = async () => {
    setChecking(true);
    try {
      const res = await superAdminAPI.checkRollNumbers();
      setIssues(res.data.issues || []);
      setSummary(res.data);
    } catch (err) {
      console.error('Error checking roll numbers:', err);
      alert('Failed to check roll numbers: ' + (err.response?.data?.error || err.message));
    }
    setChecking(false);
  };

  const fixRollNumbers = async () => {
    if (!confirm('This will regenerate roll numbers for all students. Continue?')) return;
    setFixing(true);
    try {
      const res = await superAdminAPI.fixRollNumbers();
      alert(`Fixed ${res.data.fixed_count || 0} roll numbers!`);
      checkRollNumbers();
    } catch (err) {
      console.error('Error fixing roll numbers:', err);
      alert('Failed to fix roll numbers: ' + (err.response?.data?.error || err.message));
    }
    setFixing(false);
  };

  useEffect(() => {
    checkRollNumbers();
  }, []);

  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
          <h1 className="font-serif text-3xl text-white mb-2">Roll Number Fix Tool</h1>
          <p className="text-[var(--gu-gold)] text-xs uppercase tracking-wider">
            Super Admin - Student Enrollment ID Management
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--gu-red-card)] border rounded p-4">
            <p className="text-white/60 text-sm">Total Students</p>
            <p className="text-2xl font-bold text-white">{summary?.total_students || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4">
            <p className="text-white/60 text-sm">With Roll Numbers</p>
            <p className="text-2xl font-bold text-green-400">{summary?.with_roll_number || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4">
            <p className="text-white/60 text-sm">Without Roll Numbers</p>
            <p className="text-2xl font-bold text-red-400">{summary?.without_roll_number || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4">
            <p className="text-white/60 text-sm">Issues Found</p>
            <p className="text-2xl font-bold text-yellow-400">{issues.length}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={checkRollNumbers}
            disabled={checking}
            className="px-6 py-3 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {checking ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Re-Check Issues
          </button>
          <button
            onClick={fixRollNumbers}
            disabled={fixing || issues.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            {fixing ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Fix All Issues
          </button>
        </div>

        {/* Issues List */}
        <div className="bg-[var(--gu-red-card)] border rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--gu-gold)]">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Identified Issues ({issues.length})
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {issues.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-white text-lg">All roll numbers are valid!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr className="text-white/60 text-sm">
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Enrollment No</th>
                    <th className="px-4 py-3 text-left">Course</th>
                    <th className="px-4 py-3 text-left">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, idx) => (
                    <tr key={idx} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white">{issue.name}</td>
                      <td className="px-4 py-3 text-yellow-400">{issue.enrollment_no || 'MISSING'}</td>
                      <td className="px-4 py-3 text-white/60">{issue.course}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          issue.type === 'missing' ? 'bg-red-600/20 text-red-400' :
                          issue.type === 'duplicate' ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-orange-600/20 text-orange-400'
                        }`}>
                          {issue.issue}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RollNumberFix;
