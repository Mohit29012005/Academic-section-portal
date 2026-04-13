import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { UserCheck, Search, Filter, Plus, Loader, X, FileMinus, AlertTriangle, BookOpen, Check, ChevronRight } from 'lucide-react';
import { adminAPI, academicsAPI } from '../../services/api';

const Faculty = () => {
    const [facultyData, setFacultyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    // Subject assignment states
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [allSubjects, setAllSubjects] = useState([]);
    const [assignedSubjectIds, setAssignedSubjectIds] = useState([]);
    const [assigningFaculty, setAssigningFaculty] = useState(null);
    const [savingSubjects, setSavingSubjects] = useState(false);
    const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await adminAPI.faculty();
                setFacultyData(response.data);
            } catch (error) {
                console.error("API Connection Failed.", error);
                setError("System failed to sync faculty HR records from the central database.");
                setFacultyData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const data = {
            role: 'faculty',
            name: formData.get('fullName'),
            department: formData.get('dept'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        try {
            await adminAPI.createUser(data);
            alert("Faculty Profile Generated and Welcome Email Sent.");
            setShowAddModal(false);
            // Refresh
            setLoading(true);
            const response = await adminAPI.faculty();
            setFacultyData(response.data);
            setLoading(false);
        } catch(error) {
            alert("Error onboarding faculty: " + (error.response?.data?.error || error.message));
        }
    };

    const handleLogLeave = async (employee_id, userId) => {
        try {
            await adminAPI.updateUser(userId, { status: 'On Leave' });
            setFacultyData(facultyData.map(f => f.employee_id === employee_id ? { ...f, status: 'On Leave' } : f));
            setSelectedFaculty({ ...selectedFaculty, status: 'On Leave' });
            alert("Leave Absence Registered. Sub-systems notified.");
        } catch (err) {
            alert("Failed to log leave");
        }
    };
    
    const handleRecallLeave = async (employee_id, userId) => {
        try {
            await adminAPI.updateUser(userId, { status: 'Active' });
            setFacultyData(facultyData.map(f => f.employee_id === employee_id ? { ...f, status: 'Active' } : f));
            setSelectedFaculty({ ...selectedFaculty, status: 'Active' });
            alert("Leave Absence Cleared. Status set to Active.");
        } catch (err) {
            alert("Failed to clear leave");
        }
    };

    // Open subject assignment modal
    const openSubjectAssignment = async (faculty) => {
        setAssigningFaculty(faculty);
        setSubjectSearchQuery('');
        
        // Get current assigned subject IDs
        const currentIds = (faculty.subjects_list || []).map(s => s.subject_id);
        setAssignedSubjectIds(currentIds);

        // Fetch all subjects
        try {
            const res = await academicsAPI.subjects();
            setAllSubjects(res.data);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
            setAllSubjects([]);
        }
        setShowSubjectModal(true);
    };

    const toggleSubjectSelection = (subjectId) => {
        setAssignedSubjectIds(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSaveSubjects = async () => {
        if (!assigningFaculty) return;
        setSavingSubjects(true);
        try {
            await adminAPI.assignSubjects(assigningFaculty.faculty_id, assignedSubjectIds);
            alert(`Subjects assigned successfully to ${assigningFaculty.name}`);
            
            // Refresh faculty list
            const response = await adminAPI.faculty();
            setFacultyData(response.data);
            
            // Update the selected faculty card too if it's open
            if (selectedFaculty && selectedFaculty.faculty_id === assigningFaculty.faculty_id) {
                const updated = response.data.find(f => f.faculty_id === assigningFaculty.faculty_id);
                if (updated) setSelectedFaculty(updated);
            }

            setShowSubjectModal(false);
        } catch (err) {
            alert("Failed to assign subjects: " + (err.response?.data?.error || err.message));
        } finally {
            setSavingSubjects(false);
        }
    };

    const filteredSubjects = allSubjects.filter(s => {
        const q = subjectSearchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.course_name || '').toLowerCase().includes(q);
    });

    return (
        <AdminLayout>
            <div className="animate-fade-in max-w-7xl mx-auto space-y-8 relative z-10 px-4">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-8 rounded-2xl border border-[var(--gu-gold)]/10 backdrop-blur-sm shadow-2xl">
                    <div>
                        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
                            Faculty HR Console
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
                            <span>Recruitment</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                            <span>Workload Management</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                            <span>Personnel Directory</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="group relative bg-[var(--gu-gold)] text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                        <Plus className="w-4 h-4" /> 
                        <span className="relative z-10">Onboard Faculty</span>
                        <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>

                {/* Faculty Registry Table */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl animate-slide-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    {['Employee ID', 'Personnel Identity', 'Division', 'Assigned Load', 'Status', 'Operations'].map((head, i) => (
                                        <th key={i} className={`py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ${head === 'Operations' ? 'text-right' : ''}`}>
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="inline-flex flex-col items-center gap-4">
                                                <Loader className="w-8 h-8 animate-spin text-[var(--gu-gold)]" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Accessing Personnel Vault...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : facultyData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-white/20 italic font-serif text-xl">No faculty records found in the active directory.</td>
                                    </tr>
                                ) : (
                                    facultyData.map((faculty, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-all duration-300">
                                            <td className="py-6 px-8">
                                                <span className="font-mono text-xs text-[var(--gu-gold)] opacity-60 group-hover:opacity-100 transition-opacity">{faculty.employee_id}</span>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm tracking-tight group-hover:text-[var(--gu-gold)] transition-colors">{faculty.name}</span>
                                                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{faculty.role || 'Professor'}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className="text-white/60 text-xs font-bold">{faculty.department}</span>
                                            </td>
                                            <td className="py-6 px-8 max-w-[250px]">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(faculty.subjects_list || []).length > 0 ? (
                                                        faculty.subjects_list.map((s, idx) => (
                                                            <span key={idx} className="bg-white/5 text-white/40 text-[9px] font-black px-2 py-1 rounded-full border border-white/5 uppercase tracking-wider">
                                                                {s.code || s.name.substring(0,6)}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-white/10 text-[10px] font-black uppercase tracking-widest italic">Zero Load</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                                    faculty.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                                }`}>
                                                    {faculty.status}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => openSubjectAssignment(faculty)}
                                                        className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                                                        title="Assign Subjects"
                                                    >
                                                        <BookOpen className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedFaculty(faculty)}
                                                        className="inline-flex items-center gap-2 text-[var(--gu-gold)] text-[9px] font-black uppercase tracking-widest hover:text-white border border-[var(--gu-gold)]/20 px-5 py-2.5 rounded-full transition-all hover:bg-[var(--gu-gold)]/10"
                                                    >
                                                        Manage <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recruitment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="glass-panel border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-white font-serif text-3xl tracking-tight flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <UserCheck className="w-6 h-6 text-blue-400" />
                                    </div>
                                    Personnel Intake
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] mt-1 opacity-60">Faculty Onboarding sequence</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                {/* Academic Column */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Structural Link</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Division Mapping</label>
                                            <select name="dept" required className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-blue-500/30 outline-none appearance-none transition-all">
                                                <option value="" className="bg-[var(--gu-red-deep)]">Sector Selector...</option>
                                                <option value="Computer Science" className="bg-[var(--gu-red-deep)]">Computer Science</option>
                                                <option value="Information Tech" className="bg-[var(--gu-red-deep)]">Information Technology</option>
                                                <option value="Mathematics" className="bg-[var(--gu-red-deep)]">Mathematics & Physics</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Designation Level</label>
                                            <select name="role" required className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-blue-500/30 outline-none appearance-none transition-all">
                                                <option value="" className="bg-[var(--gu-red-deep)]">Select Tier...</option>
                                                <option value="HOD" className="bg-[var(--gu-red-deep)]">Head of Department</option>
                                                <option value="Professor" className="bg-[var(--gu-red-deep)]">Professor</option>
                                                <option value="Asst. Professor" className="bg-[var(--gu-red-deep)]">Asst. Professor</option>
                                                <option value="Lecturer" className="bg-[var(--gu-red-deep)]">Lecturer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Commencement Date</label>
                                            <input name="doj" type="date" required className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-blue-500/30 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                {/* Identity Column */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[var(--gu-gold)] rounded-full"></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Personnel Identity</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Legal Designation (Full Name)</label>
                                            <input name="fullName" required type="text" placeholder="Dr. Rajesh Khanna" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Neural Comm Link (Email)</label>
                                            <input name="email" required type="email" placeholder="official@university.edu" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Signal Protocol (Phone)</label>
                                            <input name="phone" required type="tel" placeholder="+91 XXXX" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                {/* Qualifications Column */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Pedagogical Map</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Highest Credential</label>
                                            <input name="qual" required type="text" placeholder="Ph.D. in CS" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-emerald-500/30 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Tenure Profile</label>
                                            <select name="exp" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-emerald-500/30 outline-none appearance-none transition-all">
                                                <option value="1-3 Years" className="bg-[var(--gu-red-deep)]">1 - 3 Cycles</option>
                                                <option value="4-7 Years" className="bg-[var(--gu-red-deep)]">4 - 7 Cycles</option>
                                                <option value="8-12 Years" className="bg-[var(--gu-red-deep)]">8 - 12 Cycles</option>
                                                <option value="15+ Years" className="bg-[var(--gu-red-deep)]">15+ Expert</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Spatial Office Alloc</label>
                                            <input name="office" required type="text" placeholder="Block A, R-202" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-emerald-500/30 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4 justify-end">
                             <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Abort Intake</button>
                             <button type="submit" onClick={() => document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} className="bg-[var(--gu-gold)] text-black px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]">Authorize Personnel Block</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Management Console */}
            {selectedFaculty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in">
                    <div className="glass-panel border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <div className="h-32 bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-transparent relative overflow-hidden border-b border-white/5">
                             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                             <button onClick={() => setSelectedFaculty(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all backdrop-blur-md">
                                <X className="w-5 h-5" />
                             </button>
                        </div>
                        <div className="px-10 pb-10">
                            <div className="relative -mt-16 mb-8 flex items-end gap-6">
                                <div className="w-32 h-32 rounded-3xl bg-[#1A0505] border-4 border-[#1A0505] shadow-2xl flex items-center justify-center text-[var(--gu-gold)] font-serif text-5xl font-black relative overflow-hidden border border-[var(--gu-gold)]/20">
                                     {selectedFaculty.name.charAt(0)}
                                     <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500"></div>
                                </div>
                                <div className="pb-2">
                                    <h2 className="text-white font-serif text-3xl tracking-tight">{selectedFaculty.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gu-gold)]">{selectedFaculty.employee_id}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${selectedFaculty.status === 'Active' ? 'text-emerald-400 border-emerald-500/20' : 'text-amber-400 border-amber-500/20'}`}>
                                            {selectedFaculty.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {[
                                    { label: 'Division Mapping', val: selectedFaculty.department },
                                    { label: 'Personnel Rank', val: selectedFaculty.role || 'Professor' },
                                    { label: 'Credential Trace', val: selectedFaculty.qualification || 'Verified' },
                                    { label: 'Tenure Cycle', val: selectedFaculty.experience || 'Continuous' }
                                ].map((info, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{info.label}</p>
                                        <p className="text-white text-xs font-bold truncate">{info.val}</p>
                                    </div>
                                ))}
                                <div className="col-span-2 bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Active Instructional Load</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedFaculty.subjects_list || []).length > 0 ? (
                                            selectedFaculty.subjects_list.map((s, idx) => (
                                                <span key={idx} className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 rounded-full border border-blue-500/10 uppercase tracking-widest">
                                                    {s.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-white/20 text-[9px] font-black uppercase tracking-widest italic">No Global Assignment</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {selectedFaculty.status === 'Active' ? (
                                    <button 
                                        onClick={() => handleLogLeave(selectedFaculty.employee_id, selectedFaculty.user_id)}
                                        className="flex-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all"
                                    >
                                        Register Leave Block
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleRecallLeave(selectedFaculty.employee_id, selectedFaculty.user_id)}
                                        className="flex-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        Clear Absence Record
                                    </button>
                                )}
                                <button 
                                    onClick={() => openSubjectAssignment(selectedFaculty)}
                                    className="flex-1 bg-blue-500 text-white py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Modify Workload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Balancing / Subject Assignment Modal */}
            {showSubjectModal && assigningFaculty && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-fade-in">
                    <div className="glass-panel border-white/10 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-900/10">
                            <div>
                                <h2 className="text-white font-serif text-3xl tracking-tight flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                    </div>
                                    Subject Vector Mapping
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mt-1 opacity-60">Optimizing Workload Balance: {assigningFaculty.name}</p>
                            </div>
                            <button onClick={() => setShowSubjectModal(false)} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-10 flex-1 overflow-hidden flex flex-col">
                            {/* Search Registry */}
                            <div className="relative mb-8">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="Scrub Registry by Name, Code, or Sector Focus..."
                                    value={subjectSearchQuery}
                                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 text-white pl-16 pr-8 py-5 rounded-2xl text-sm focus:border-blue-500/30 outline-none transition-all focus:bg-white/10"
                                />
                            </div>

                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Module Directory</h3>
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    {assignedSubjectIds.length} Nodes Active
                                </span>
                            </div>

                            {/* Node Selection List */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                                {filteredSubjects.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                                        <BookOpen className="w-20 h-20 mb-4" />
                                        <p className="font-serif text-2xl italic">Zero modules found in registry.</p>
                                    </div>
                                ) : (
                                    filteredSubjects.map((subject) => {
                                        const isSelected = assignedSubjectIds.includes(subject.subject_id);
                                        return (
                                            <button
                                                key={subject.subject_id}
                                                onClick={() => toggleSubjectSelection(subject.subject_id)}
                                                className={`w-full text-left flex items-center justify-between p-6 rounded-2xl transition-all border group ${
                                                    isSelected
                                                        ? 'bg-blue-500/20 border-blue-500/40'
                                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black border px-2 py-0.5 rounded transition-all ${isSelected ? 'border-blue-500/40 text-blue-400' : 'border-white/10 text-white/30 group-hover:text-white/60'}`}>
                                                            {subject.code}
                                                        </span>
                                                        <span className={`text-sm font-bold tracking-tight transition-all ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                                            {subject.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{subject.course_name}</span>
                                                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Sem {subject.semester}</span>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-white/10'
                                                }`}>
                                                    {isSelected && <Check className="w-4 h-4 text-white stroke-[4px]" />}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                            <button 
                                onClick={() => setShowSubjectModal(false)} 
                                className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                            >
                                Abort Sequence
                            </button>
                            <button 
                                onClick={handleSaveSubjects}
                                disabled={savingSubjects}
                                className="bg-blue-500 text-white px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
                            >
                                {savingSubjects ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Commit Module Vector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Faculty;
