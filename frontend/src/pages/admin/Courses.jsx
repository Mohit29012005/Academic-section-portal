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
            <div className="animate-fade-in max-w-7xl mx-auto">
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 word-wrap break-words">Curriculum Matrix</h1>
                        <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                            Program Definitions & Syllabus Governance
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-[var(--gu-gold)] text-[#1A0505] px-4 py-2 text-sm font-bold uppercase tracking-widest flex items-center hover:bg-[#e6c949] transition-colors rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Define New Program
                    </button>
                </div>

                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-[#3D0F0F] border-b border-[var(--gu-border)]">
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Track ID</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Program Nomenclature</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Students</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Duration</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Type</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Status</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-[var(--gu-gold)]">
                                        <Loader className="w-8 h-8 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center bg-[rgba(239,68,68,0.05)] border-y border-[rgba(239,68,68,0.2)]">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                                        <p className="text-red-400 font-semibold mb-1">Database Connectivity Interrupted</p>
                                        <p className="text-red-300 text-xs opacity-80">{error}</p>
                                    </td>
                                </tr>
                            ) : coursesData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-500">No programs mapped.</td>
                                </tr>
                            ) : (
                                coursesData.map((course, i) => (
                                    <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                        <td className="py-4 px-6 font-mono text-sm text-[var(--gu-gold)]">{course.code}</td>
                                        <td className="py-4 px-6 text-white font-medium">
                                            {course.name}
                                            <div className="text-xs text-gray-400 font-normal mt-0.5">{course.department}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 text-sm font-bold rounded-sm ${
                                                (course.student_count || 0) > 0 
                                                    ? 'bg-green-400/10 text-green-400' 
                                                    : 'bg-gray-400/10 text-gray-400'
                                            }`}>
                                                {course.student_count || 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-300">{course.duration} Years</td>
                                        <td className="py-4 px-6 text-sm text-gray-300">{course.level || "N/A"}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-sm ${
                                                course.status === 'Active' ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 
                                                'text-red-400 bg-red-400/10 border border-red-400/20'
                                            }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => setSelectedCourse(course)}
                                                className="text-[var(--gu-gold)] text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors border border-[rgba(212,175,55,0.3)] px-3 py-1 rounded-sm"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals outside flow */}
            {/* New Program Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto pt-[10vh]">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in my-auto relative">
                        <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A] sticky top-0 z-10">
                            <h2 className="text-[var(--gu-gold)] font-serif text-xl flex items-center"><Edit3 className="w-5 h-5 mr-2" /> Define Base Program</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Identifier Column */}
                                <div className="space-y-4">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2 text-gray-400">Core Specification</h3>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Master Program Name</label>
                                        <input name="name" required type="text" placeholder="e.g. Master of Data Science" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                    <div className="flex space-x-3">
                                        <div className="w-1/2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Track Code</label>
                                            <input name="code" required type="text" placeholder="e.g. MDS, B.Tech CSE" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Origin Department</label>
                                            <select name="dept" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                                <option value="Computer Science">Computer Science</option>
                                                <option value="Information Tech">It Dept</option>
                                                <option value="Management">Management</option>
                                                <option value="Arts">Arts & Comm</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Descriptive Index</label>
                                        <textarea name="desc" required rows="2" placeholder="Brief outline of the program trajectory..." className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none resize-none"></textarea>
                                    </div>
                                </div>

                                {/* Matrix Rules Column */}
                                <div className="space-y-4">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2 text-gray-400">Lifecycle Matrix</h3>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Degree Level Taxonomy</label>
                                        <select name="level" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                            <option value="">Select Bracket...</option>
                                            <option value="Undergraduate">Undergraduate (UG)</option>
                                            <option value="Postgraduate">Postgraduate (PG)</option>
                                            <option value="Doctoral">Doctoral (Ph.D.)</option>
                                            <option value="Diploma">Certification / Diploma</option>
                                        </select>
                                    </div>
                                    <div className="flex space-x-3">
                                        <div className="w-1/2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Base Duration</label>
                                            <select name="duration" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                                <option value="1 Year">1 Year</option>
                                                <option value="2 Years">2 Years</option>
                                                <option value="3 Years">3 Years</option>
                                                <option value="4 Years">4 Years</option>
                                                <option value="5 Years">5 Years (Integrated)</option>
                                            </select>
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Total Credits req.</label>
                                            <input name="credits" required type="number" min="10" max="300" placeholder="e.g. 160" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end space-x-3 mt-4 border-t border-[rgba(255,255,255,0.1)] sticky bottom-0 bg-[#1A0505] pb-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-colors">Abort</button>
                                <button type="submit" className="bg-[var(--gu-gold)] text-[#1A0505] px-8 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm shadow-xl shadow-[var(--gu-gold)]/20">Inject Program Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Course Modal */}
            {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-4xl my-8 overflow-hidden shadow-2xl animate-fade-in relative">
                        <div className="p-5 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A] sticky top-0 z-10">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-sm bg-gradient-to-br from-[var(--gu-gold)] to-yellow-600 text-[#1A0505] flex items-center justify-center font-bold text-xl uppercase shadow-md shadow-black">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-3 text-white font-serif text-2xl leading-none pt-1">
                                        <h2>{selectedCourse.name}</h2>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-sans tracking-widest rounded flex items-center h-5 ${selectedCourse.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {selectedCourse.status} {selectedCourse.status === 'Suspended' && <AlertOctagon className="w-3 h-3 ml-1" />}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[var(--gu-gold)] text-xs font-mono tracking-widest mt-1">
                                        <span>{selectedCourse.code}</span>
                                        <span className="text-gray-600">•</span>
                                        <span>{selectedCourse.department} root</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCourse(null)} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            
                            {/* Detailed Grid Map */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm relative overflow-hidden group hover:border-[rgba(212,175,55,0.2)] transition-colors">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--gu-gold)] opacity-[0.03] rotate-45 transform translate-x-8 -translate-y-8 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Cycle Parameters</p>
                                    <p className="text-white text-base">{selectedCourse.duration} Years</p>
                                    <p className="text-gray-400 text-xs mt-1 bg-black/20 inline-block px-2 py-1 rounded">Bracket: {selectedCourse.level || "N/A"}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--gu-gold)] opacity-[0.03] rotate-45 transform translate-x-8 -translate-y-8 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Academic Credential Limit</p>
                                    <p className="text-white text-2xl font-serif mt-1">{selectedCourse.credits}</p>
                                    <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-1 border-t border-[rgba(255,255,255,0.1)] pt-1">Total Graduation Credits</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm md:col-span-3 border-l-4 border-l-[var(--gu-gold)]">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Program Summary Description</p>
                                    <p className="text-white text-sm leading-relaxed mt-1 opacity-90">{selectedCourse.desc || "Data segment empty."}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm md:col-span-3 flex justify-between items-center text-gray-400">
                                    <span className="text-xs uppercase tracking-widest flex items-center">
                                       <span className="w-2 h-2 rounded-full bg-[var(--gu-gold)] animate-pulse mr-2"></span> Sub-Subject Tree Online
                                    </span>
                                    <button className="text-[var(--gu-gold)] text-xs uppercase tracking-widest hover:text-white font-bold" onClick={() => alert("Dummy Action: Subject curriculum array tree visualization opened.")}>View Syllabus Tree</button>
                                </div>
                            </div>
                            
                            {/* Operations */}
                            <div className="pt-6 border-t border-[rgba(255,255,255,0.1)] flex flex-wrap justify-end gap-3 rounded-sm bg-[#1A0505]">
                                {selectedCourse.status === 'Active' ? (
                                    <button 
                                        onClick={() => handleDeactivate(selectedCourse.course_id || selectedCourse.id)}
                                        className="border border-red-500 text-red-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors rounded-sm flex items-center"
                                    >
                                        <AlertOctagon className="w-4 h-4 mr-2" /> Deactivate Program
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleReactivate(selectedCourse.course_id || selectedCourse.id)}
                                        className="border border-green-500 text-green-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-500 hover:text-[#1A0505] transition-colors rounded-sm flex items-center"
                                    >
                                        Reactivate Root Track
                                    </button>
                                )}
                                <button className="border border-[var(--gu-gold)] text-[var(--gu-gold)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[var(--gu-gold)] hover:text-[#1A0505] transition-colors rounded-sm shadow-md" onClick={() => alert("Dummy Edit Mode: Upload new syllabus CSV overlay.")}>
                                    Update Tree / Syllabus
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
