import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { UserCheck, Search, Filter, Plus, Loader, X, FileMinus, AlertTriangle, BookOpen, Check } from 'lucide-react';
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
            <div className="animate-fade-in max-w-7xl mx-auto">
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 word-wrap break-words">Faculty HR</h1>
                        <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                            Recruitment, Workload & Leaves
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-[var(--gu-gold)] text-[#1A0505] px-4 py-2 text-sm font-bold uppercase tracking-widest flex items-center hover:bg-[#e6c949] transition-colors rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Onboard Faculty
                    </button>
                </div>

                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-[#3D0F0F] border-b border-[var(--gu-border)]">
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Faculty ID</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Name & Title</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Department</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Subjects</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Status</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-[var(--gu-gold)]">
                                        <Loader className="w-8 h-8 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center bg-[rgba(239,68,68,0.05)] border-y border-[rgba(239,68,68,0.2)]">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                                        <p className="text-red-400 font-semibold mb-1">Database Connectivity Interrupted</p>
                                        <p className="text-red-300 text-xs opacity-80">{error}</p>
                                    </td>
                                </tr>
                            ) : facultyData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">No faculty members found.</td>
                                </tr>
                            ) : (
                                facultyData.map((faculty, i) => (
                                    <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                        <td className="py-4 px-6 font-mono text-sm text-[var(--gu-gold)] cursor-pointer hover:underline" onClick={() => setSelectedFaculty(faculty)}>{faculty.employee_id}</td>
                                        <td className="py-4 px-6 text-white font-medium">{faculty.name}</td>
                                        <td className="py-4 px-6 text-sm text-gray-300">{faculty.department}</td>
                                        <td className="py-4 px-6 text-sm">
                                            {(faculty.subjects_list || []).length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {faculty.subjects_list.map((s, idx) => (
                                                        <span key={idx} className="inline-block bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] border border-[var(--gu-gold)]/20 px-2 py-0.5 text-[10px] rounded-sm font-semibold uppercase tracking-wider">
                                                            {s.code || s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-xs italic">None assigned</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-sm ${
                                                faculty.status === 'Active' ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 
                                                'text-amber-400 bg-amber-400/10 border border-amber-400/20'
                                            }`}>
                                                {faculty.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openSubjectAssignment(faculty)}
                                                    className="text-blue-400 text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors border border-blue-400/30 px-3 py-1 rounded-sm"
                                                    title="Assign Subjects"
                                                >
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedFaculty(faculty)}
                                                    className="text-[var(--gu-gold)] text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors border border-[rgba(212,175,55,0.3)] px-3 py-1 rounded-sm"
                                                >
                                                    Manage
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

            {/* Modals outside flow */}
            {/* Onboard Faculty Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto pt-[10vh]">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in my-auto relative">
                        <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A] sticky top-0 z-10">
                            <h2 className="text-[var(--gu-gold)] font-serif text-xl flex items-center"><UserCheck className="w-5 h-5 mr-2" /> Submit Regional HR Intake</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Academic Column */}
                                <div className="space-y-4">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2 text-gray-400">Assignment Parameters</h3>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Target Department</label>
                                        <select name="dept" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                            <option value="">Select Division...</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Information Tech">Information Technology</option>
                                            <option value="Mathematics">Mathematics & Physics</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Administrative Role</label>
                                        <select name="role" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                            <option value="">Select Designation...</option>
                                            <option value="HOD">Head of Department (HOD)</option>
                                            <option value="Professor">Professor</option>
                                            <option value="Asst. Professor">Asst. Professor</option>
                                            <option value="Lecturer">Lecturer</option>
                                            <option value="Guest Faculty">Guest Faculty</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Appointed Joining Date</label>
                                        <input name="doj" type="date" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                </div>

                                {/* Identity Column */}
                                <div className="space-y-4">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2 text-gray-400">Personnel Identity</h3>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Full Name (with honorific)</label>
                                        <input name="fullName" required type="text" placeholder="e.g. Dr. Rajesh Khanna" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Institutional Email Block</label>
                                        <input name="email" required type="email" placeholder="john.doe@gnu.ac.in" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Ext. Mobile Contact</label>
                                        <input name="phone" required type="tel" placeholder="+91 XXXX XXXXX" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                </div>

                                {/* Qualifications Column */}
                                <div className="space-y-4">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2 text-gray-400">Experience Map</h3>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Verified Credential</label>
                                        <input name="qual" required type="text" placeholder="e.g. Ph.D. in Cybernetics" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Tenure / Industry Experience</label>
                                        <select name="exp" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                            <option value="1-3 Years">1 - 3 Years</option>
                                            <option value="4-7 Years">4 - 7 Years</option>
                                            <option value="8-12 Years">8 - 12 Years</option>
                                            <option value="15+ Years">15+ Years</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Campus Office Alloc</label>
                                        <input name="office" required type="text" placeholder="e.g. CS Block, R-102" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end space-x-3 mt-4 border-t border-[rgba(255,255,255,0.1)] sticky bottom-0 bg-[#1A0505] pb-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-colors">Cancel</button>
                                <button type="submit" className="bg-[var(--gu-gold)] text-[#1A0505] px-8 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm shadow-xl shadow-[var(--gu-gold)]/20">Authorize & Onboard</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Faculty Modal */}
            {selectedFaculty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-4xl my-8 overflow-hidden shadow-2xl animate-fade-in relative">
                        <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A] sticky top-0 z-10">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-sm bg-[var(--gu-gold)] text-[#1A0505] flex items-center justify-center font-bold text-2xl uppercase shadow-md shadow-black">
                                    {selectedFaculty.name.replace(/[^a-zA-Z]/g, '').substring(0,2)}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-3 text-white font-serif text-2xl leading-none pt-1">
                                        <h2>{selectedFaculty.name}</h2>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-sans tracking-widest rounded flex items-center h-5 ${selectedFaculty.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                            {selectedFaculty.status} {selectedFaculty.status === 'On Leave' && <FileMinus className="w-3 h-3 ml-1" />}
                                        </span>
                                    </div>
                                    <span className="text-[var(--gu-gold)] text-xs font-mono tracking-widest mt-1 block">{selectedFaculty.employee_id} • Dept. of {selectedFaculty.department}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFaculty(null)} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            
                            {/* Detailed Grid Map */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Department Block</p>
                                    <p className="text-white text-base">{selectedFaculty.department}</p>
                                    <p className="text-gray-400 text-xs mt-1 bg-black/20 inline-block px-2 py-1 rounded">Rank: {selectedFaculty.role}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Academic Credential</p>
                                    <p className="text-white text-sm mt-1">{selectedFaculty.qualification || "Ph.D. Undefined"}</p>
                                    <p className="text-gray-400 text-xs mt-1">Exp: {selectedFaculty.experience}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">System Comm Email</p>
                                    <p className="text-white text-sm break-all mt-1">{selectedFaculty.email || "N/A"}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80 mt-3 border-t border-[rgba(255,255,255,0.1)] pt-2">Mobile Ext</p>
                                    <p className="text-white text-sm">{selectedFaculty.phone || "N/A"}</p>
                                </div>
                            </div>

                            {/* Assigned Subjects Section */}
                            <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold opacity-80">Assigned Subjects</p>
                                    <button
                                        onClick={() => openSubjectAssignment(selectedFaculty)}
                                        className="text-[10px] uppercase tracking-widest text-blue-400 font-bold hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <BookOpen className="w-3 h-3" /> Manage Subjects
                                    </button>
                                </div>
                                {(selectedFaculty.subjects_list || []).length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFaculty.subjects_list.map((s, idx) => (
                                            <span key={idx} className="inline-flex items-center bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] border border-[var(--gu-gold)]/20 px-3 py-1.5 text-xs rounded-sm font-semibold">
                                                {s.code ? `${s.code} — ` : ''}{s.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No subjects assigned yet. Click "Manage Subjects" to assign.</p>
                                )}
                            </div>
                            
                            {/* Operations */}
                            <div className="pt-6 border-t border-[rgba(255,255,255,0.1)] flex flex-wrap justify-end gap-3 rounded-sm">
                                {selectedFaculty.status === 'Active' ? (
                                    <button 
                                        onClick={() => handleLogLeave(selectedFaculty.employee_id, selectedFaculty.user_id)}
                                        className="border border-amber-500 text-amber-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-[#1A0505] transition-colors rounded-sm flex items-center"
                                    >
                                        <FileMinus className="w-4 h-4 mr-2" /> Log Temporary Leave
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleRecallLeave(selectedFaculty.employee_id, selectedFaculty.user_id)}
                                        className="border border-green-500 text-green-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-500 hover:text-[#1A0505] transition-colors rounded-sm flex items-center"
                                    >
                                        Recall & Return Active
                                    </button>
                                )}
                                <button 
                                    onClick={() => openSubjectAssignment(selectedFaculty)}
                                    className="border border-blue-500 text-blue-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-[#1A0505] transition-colors rounded-sm flex items-center"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" /> Assign Subjects
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Subjects Modal */}
            {showSubjectModal && assigningFaculty && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-[#1A0505] border border-blue-500/50 rounded-sm w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-fade-in relative">
                        <div className="p-4 border-b border-blue-500/30 flex justify-between items-center bg-[#0D1B2A] sticky top-0 z-10">
                            <div>
                                <h2 className="text-blue-400 font-serif text-xl flex items-center">
                                    <BookOpen className="w-5 h-5 mr-2" /> Assign Subjects
                                </h2>
                                <p className="text-white/50 text-xs mt-1">{assigningFaculty.name} — {assigningFaculty.employee_id}</p>
                            </div>
                            <button onClick={() => setShowSubjectModal(false)} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search subjects by name, code, or course..."
                                    value={subjectSearchQuery}
                                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                    className="w-full bg-[#3D0F0F] border border-[rgba(255,255,255,0.1)] text-white p-3 text-sm rounded-sm focus:outline-none focus:border-blue-400 placeholder-white/30"
                                />
                            </div>

                            <div className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">
                                {assignedSubjectIds.length} subject{assignedSubjectIds.length !== 1 ? 's' : ''} selected
                            </div>

                            {/* Subject List */}
                            <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1">
                                {filteredSubjects.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No subjects found.</p>
                                ) : (
                                    filteredSubjects.map((subject) => {
                                        const isSelected = assignedSubjectIds.includes(subject.subject_id);
                                        return (
                                            <button
                                                key={subject.subject_id}
                                                onClick={() => toggleSubjectSelection(subject.subject_id)}
                                                className={`w-full text-left flex items-center justify-between p-3 rounded-sm transition-all border ${
                                                    isSelected
                                                        ? 'bg-blue-500/15 border-blue-500/40 text-white'
                                                        : 'bg-[#3D0F0F] border-transparent text-white/70 hover:bg-[#4D1F1F] hover:text-white'
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-[var(--gu-gold)]">{subject.code}</span>
                                                        <span className="text-sm font-medium truncate">{subject.name}</span>
                                                    </div>
                                                    <div className="text-[10px] text-white/40 mt-0.5">
                                                        {subject.course_name || 'Unknown Course'} · Sem {subject.semester}
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${
                                                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-[rgba(255,255,255,0.1)] flex justify-end gap-3 bg-[#0D1B2A]">
                            <button 
                                onClick={() => setShowSubjectModal(false)} 
                                className="px-5 py-2.5 text-sm text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveSubjects}
                                disabled={savingSubjects}
                                className="bg-blue-500 text-white px-8 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors rounded-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingSubjects && <Loader className="w-4 h-4 animate-spin" />}
                                Save Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Faculty;
