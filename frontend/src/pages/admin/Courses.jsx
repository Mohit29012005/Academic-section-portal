import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { BookOpen, Search, Filter, Plus, Loader, X, AlertOctagon, Edit3, AlertTriangle } from 'lucide-react';
import { academicsAPI } from '../../services/api';

const Courses = () => {
    const [coursesData, setCoursesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await academicsAPI.courses();
            setCoursesData(response.data);
        } catch (error) {
            console.error("API Connection Failed.", error);
            setError("System failed to retrieve base curriculum patterns from the central database.");
            setCoursesData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dur = parseInt(formData.get('duration').split(' ')[0] || '1');
        
        const newCourse = {
            code: formData.get('code'),
            name: formData.get('name'),
            duration: dur,
            total_semesters: dur * 2,
            level: formData.get('level'),
            credits: parseInt(formData.get('credits')),
            department: formData.get('dept'),
            desc: formData.get('desc'),
            status: "Active"
        };
        
        try {
            await academicsAPI.createCourse(newCourse);
            alert("Curriculum Program Initialized and Broadcasted.");
            setShowAddModal(false);
            fetchCourses();
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.error || error.response?.data?.details 
                ? JSON.stringify(error.response?.data?.details) 
                : error.message;
            alert("Failed to initialize course program: " + errMsg);
        }
    };

    const handleDeactivate = async (id) => {
        if(window.confirm("CRITICAL: Deactivating a core curriculum will halt all student mappings corresponding to this root track. Ensure graduation cycles are closed. Proceed?")) {
            try {
                await academicsAPI.updateCourse(id, { status: 'Suspended' });
                setCoursesData(coursesData.map(c => (c.course_id || c.id) === id ? { ...c, status: 'Suspended' } : c));
                setSelectedCourse({ ...selectedCourse, status: 'Suspended' });
                alert("Curriculum Track Deactivated.");
            } catch (error) {
                console.error(error);
                alert("Failed to deactivate course.");
            }
        }
    };
    
    const handleReactivate = async (id) => {
        try {
            await academicsAPI.updateCourse(id, { status: 'Active' });
            setCoursesData(coursesData.map(c => (c.course_id || c.id) === id ? { ...c, status: 'Active' } : c));
            setSelectedCourse({ ...selectedCourse, status: 'Active' });
            alert("Curriculum Track Restored Online.");
        } catch (error) {
            console.error(error);
            alert("Failed to restore course.");
        }
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in max-w-7xl mx-auto space-y-8 relative z-10 px-4">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-8 rounded-2xl border border-[var(--gu-gold)]/10 backdrop-blur-sm shadow-2xl">
                    <div>
                        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
                            Curriculum Architecture
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
                            <span>Program Definitions</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                            <span>Syllabus Governance</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                            <span>Academic Mapping</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="group relative bg-[var(--gu-gold)] text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                        <Plus className="w-4 h-4" /> 
                        <span className="relative z-10">Define New Program</span>
                        <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>

                {/* Course Matrix Table */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl animate-slide-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    {['Track ID', 'Program Nomenclature', 'Students', 'Lifecycle', 'Credits', 'Status', 'Actions'].map((head, i) => (
                                        <th key={i} className={`py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ${head === 'Actions' ? 'text-right' : ''}`}>
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center">
                                            <div className="inline-flex flex-col items-center gap-4">
                                                <Loader className="w-8 h-8 animate-spin text-[var(--gu-gold)]" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Synthesizing Course Data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center bg-red-500/5">
                                            <AlertOctagon className="w-8 h-8 mx-auto mb-4 text-red-500 opacity-50" />
                                            <p className="text-red-400 font-serif text-xl italic">{error}</p>
                                        </td>
                                    </tr>
                                ) : coursesData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-white/20 italic font-serif text-xl">No curriculum tracks mapped in active registry.</td>
                                    </tr>
                                ) : (
                                    coursesData.map((course, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-all duration-300">
                                            <td className="py-6 px-8">
                                                <span className="font-mono text-xs text-[var(--gu-gold)] opacity-60 group-hover:opacity-100 transition-opacity">{course.code}</span>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm tracking-tight group-hover:text-[var(--gu-gold)] transition-colors">{course.name}</span>
                                                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{course.department}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black rounded-lg border ${
                                                    (course.student_count || 0) > 0 
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                                        : 'bg-white/5 text-white/20 border-white/5'
                                                }`}>
                                                    {course.student_count || 0} SEATS
                                                </span>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className="text-white/60 text-xs font-bold uppercase tracking-tighter">{course.duration} Cycles</span>
                                                <div className="text-[9px] text-white/20 font-black tracking-widest mt-1 uppercase">{course.level || 'Degree'}</div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className="text-white font-mono text-sm group-hover:text-[var(--gu-gold)] transition-colors">{course.credits}</span>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                                    course.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                                    'text-red-400 bg-red-500/10 border-red-500/20'
                                                }`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <button 
                                                    onClick={() => setSelectedCourse(course)}
                                                    className="inline-flex items-center gap-2 text-[var(--gu-gold)] text-[9px] font-black uppercase tracking-widest hover:text-white border border-[var(--gu-gold)]/20 px-5 py-2.5 rounded-full transition-all hover:bg-[var(--gu-gold)]/10"
                                                >
                                                    Manage <Edit3 className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Program Definition Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="glass-panel border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-white font-serif text-3xl tracking-tight flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <BookOpen className="w-6 h-6 text-purple-400" />
                                    </div>
                                    Program Blueprint
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] mt-1 opacity-60">Initializing Curriculum Architecture</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Program Matrix Column */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Nomenclature</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Official Program Name</label>
                                            <input name="name" required type="text" placeholder="B.Tech Computer Science" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-purple-500/30 outline-none transition-all placeholder:text-white/10" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Track Identifier</label>
                                                <input name="code" required type="text" placeholder="BT-CSE" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-purple-500/30 outline-none transition-all uppercase placeholder:text-white/10" />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Assigned Segment</label>
                                                <select name="dept" required className="w-full bg-white/5 border border-white/5 text-white px-4 py-3 rounded-xl text-xs focus:border-purple-500/30 outline-none appearance-none transition-all">
                                                    <option value="Computer Science" className="bg-[#1A0505]">Computer Science</option>
                                                    <option value="Information Tech" className="bg-[#1A0505]">Information Tech</option>
                                                    <option value="Management" className="bg-[#1A0505]">Management</option>
                                                    <option value="Arts" className="bg-[#1A0505]">Arts & Comm</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Program Abstract</label>
                                            <textarea name="desc" rows="4" placeholder="Mapping curriculum goals and terminal objective vectors..." className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-purple-500/30 outline-none transition-all resize-none placeholder:text-white/10"></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Ruleset Column */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[var(--gu-gold)] rounded-full"></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Academic Matrix</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Degree Tier Taxonomy</label>
                                            <select name="level" required className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-[var(--gu-gold)]/30 outline-none appearance-none transition-all">
                                                <option value="Undergraduate" className="bg-[#1A0505]">Undergraduate (UG)</option>
                                                <option value="Postgraduate" className="bg-[#1A0505]">Postgraduate (PG)</option>
                                                <option value="Doctoral" className="bg-[#1A0505]">Doctoral (Ph.D.)</option>
                                                <option value="Diploma" className="bg-[#1A0505]">Diploma</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Instructional Cycles</label>
                                                <select name="duration" required className="w-full bg-white/5 border border-white/5 text-white px-4 py-3 rounded-xl text-xs focus:border-[var(--gu-gold)]/30 outline-none appearance-none transition-all">
                                                    <option value="1 Year" className="bg-[#1A0505]">1 Cycle</option>
                                                    <option value="2 Years" className="bg-[#1A0505]">2 Cycles</option>
                                                    <option value="3 Years" className="bg-[#1A0505]">3 Cycles</option>
                                                    <option value="4 Years" className="bg-[#1A0505]">4 Cycles</option>
                                                    <option value="5 Years" className="bg-[#1A0505]">5 Cycles</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Total Credit Yield</label>
                                                <input name="credits" required type="number" placeholder="160" className="w-full bg-white/5 border border-white/5 text-white px-5 py-3 rounded-xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all placeholder:text-white/10" />
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-start gap-4">
                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Architecture Sync</h4>
                                                <p className="text-[10px] text-white/40 leading-relaxed font-bold">Injecting this program model will automatically generate 2x semester clusters per year cycle. Subject trees must be mapped post-initialization.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4 justify-end">
                             <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Discard Draft</button>
                             <button type="submit" onClick={() => document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} className="bg-[var(--gu-gold)] text-black px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]">Commit Architecture</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Program Management Terminal */}
            {selectedCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in">
                    <div className="glass-panel border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <div className="h-32 bg-gradient-to-r from-purple-900/40 via-purple-800/20 to-transparent relative overflow-hidden border-b border-white/5">
                             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                             <button onClick={() => setSelectedCourse(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all backdrop-blur-md">
                                <X className="w-5 h-5" />
                             </button>
                        </div>
                        <div className="px-10 pb-10">
                            <div className="relative -mt-16 mb-8 flex items-end gap-6">
                                <div className="w-32 h-32 rounded-3xl bg-[#1A0505] border-4 border-[#1A0505] shadow-2xl flex items-center justify-center text-[var(--gu-gold)] font-serif text-5xl font-black relative overflow-hidden border border-[var(--gu-gold)]/20">
                                     {selectedCourse.code.charAt(0)}
                                     <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                </div>
                                <div className="pb-2">
                                    <h2 className="text-white font-serif text-3xl tracking-tight">{selectedCourse.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gu-gold)]">{selectedCourse.code}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${selectedCourse.status === 'Active' ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'}`}>
                                            {selectedCourse.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {[
                                    { label: 'Cycle Parameters', val: `${selectedCourse.duration} Year Track` },
                                    { label: 'Credential Weight', val: `${selectedCourse.credits} Total Units` },
                                    { label: 'Mapping Segment', val: selectedCourse.department },
                                    { label: 'Enrollment Count', val: `${selectedCourse.student_count || 0} Registered` }
                                ].map((info, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{info.label}</p>
                                        <p className="text-white text-xs font-bold truncate">{info.val}</p>
                                    </div>
                                ))}
                                <div className="col-span-2 bg-white/5 border border-white/5 p-5 rounded-2xl border-l-4 border-l-purple-500/50">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Program Abstract Trace</p>
                                    <p className="text-white/60 text-[10px] font-bold leading-relaxed">{selectedCourse.desc || 'No descriptive data mapped for this curriculum root.'}</p>
                                </div>
                                <div className="col-span-2 flex items-center justify-between p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.20em] text-purple-400/60">Sub-Subject Matrix Registry</span>
                                    <button className="text-[9px] font-black uppercase tracking-widest text-white border border-white/10 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all">Expand Syllabus</button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {selectedCourse.status === 'Active' ? (
                                    <button 
                                        onClick={() => handleDeactivate(selectedCourse.course_id || selectedCourse.id)}
                                        className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        Suspend Track
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleReactivate(selectedCourse.course_id || selectedCourse.id)}
                                        className="flex-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        Restore Track
                                    </button>
                                )}
                                <button 
                                    className="flex-1 bg-purple-500 text-white py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg shadow-purple-500/20"
                                    onClick={() => alert("Curriculum Editor Initialized")}
                                >
                                    Modify Matrix
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Courses;
