import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Users, Search, Filter, Plus, Loader, X, AlertTriangle } from 'lucide-react';
import { adminAPI, academicsAPI } from '../../services/api';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [courses, setCourses] = useState([]);
    const [courseFilter, setCourseFilter] = useState('');

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError(null);
                // Fetch courses for dropdowns
                try {
                    const coursesRes = await academicsAPI.courses();
                    setCourses(coursesRes.data);
                } catch(err) {
                    console.warn("Failed to fetch courses", err);
                }

                // Fetch students
                const response = await adminAPI.students(courseFilter ? { course_id: courseFilter } : {});
                setStudents(response.data);
            } catch (error) {
                console.error("API Connection Failed.", error);
                setError("System failed to sync student directory from the central database.");
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [courseFilter]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            role: 'student',
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            course_id: formData.get('course'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };
        try {
            await adminAPI.createUser(data);
            alert("Student Successfully Enrolled into System. Credentials sent via Email.");
            setShowAddModal(false);
            // Refresh List
            setLoading(true);
            const response = await adminAPI.students(courseFilter ? { course_id: courseFilter } : {});
            setStudents(response.data);
            setLoading(false);
        } catch(error) {
            alert("Error creating student: " + (error.response?.data?.error || error.message));
        }
    };

    const handleSuspend = async (enrollment_no, userId) => {
        if(window.confirm("Are you sure you want to suspend this student account? All portal access will be revoked immediately.")) {
            try {
                await adminAPI.updateUser(userId, { status: 'Suspended' });
                setStudents(students.map(s => s.enrollment_no === enrollment_no ? { ...s, status: 'Suspended' } : s));
                setSelectedStudent({ ...selectedStudent, status: 'Suspended' });
                alert("Account Suspended.");
            } catch (err) {
                alert("Failed to suspend account");
            }
        }
    };

    const handleActivate = async (enrollment_no, userId) => {
        try {
            await adminAPI.updateUser(userId, { status: 'Active' });
            setStudents(students.map(s => s.enrollment_no === enrollment_no ? { ...s, status: 'Active' } : s));
            setSelectedStudent({ ...selectedStudent, status: 'Active' });
            alert("Account Reactivated.");
        } catch (err) {
            alert("Failed to reactivate account");
        }
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in max-w-7xl mx-auto">
                {/* Header */}
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 word-wrap break-words">Student Lifecycle</h1>
                        <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                            Admissions, Enrollments & Directory
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <select 
                            className="bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                        >
                            <option value="">All Courses</option>
                            {courses.map(c => (
                                <option key={c.course_id} value={c.course_id}>{c.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-[var(--gu-gold)] text-[#1A0505] px-4 py-2 text-sm font-bold uppercase tracking-widest flex items-center hover:bg-[#e6c949] transition-colors rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Student
                        </button>
                    </div>
                </div>

                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-[#3D0F0F] border-b border-[var(--gu-border)]">
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Student ID</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Name</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Course & Sem</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">Status</th>
                                <th className="py-4 px-6 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-[var(--gu-gold)]">
                                        <Loader className="w-8 h-8 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center bg-[rgba(239,68,68,0.05)] border-y border-[rgba(239,68,68,0.2)]">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                                        <p className="text-red-400 font-semibold mb-1">Database Connectivity Interrupted</p>
                                        <p className="text-red-300 text-xs opacity-80">{error}</p>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">No students found.</td>
                                </tr>
                            ) : (
                                students.map((student, i) => (
                                    <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                        <td className="py-4 px-6 font-mono text-sm text-[var(--gu-gold)]">{student.enrollment_no}</td>
                                        <td className="py-4 px-6 text-white font-medium">{student.name}</td>
                                        <td className="py-4 px-6 text-sm text-gray-300">{student.course_name}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-sm ${
                                                student.status === 'Active' ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 
                                                student.status === 'Suspended' ? 'text-red-400 bg-red-400/10 border border-red-400/20' :
                                                'text-blue-400 bg-blue-400/10 border border-blue-400/20'
                                            }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => setSelectedStudent(student)}
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
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto pt-[10vh]">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in my-auto relative">
                        <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A] sticky top-0 z-10">
                            <h2 className="text-[var(--gu-gold)] font-serif text-xl flex items-center"><Plus className="w-5 h-5 mr-2" /> New Student Enrollment</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Academic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-white text-sm font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2">Academic Mapping</h3>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Target Degree / Program</label>
                                        <select name="course" required className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                            <option value="">Select Degree Plan...</option>
                                            {courses.map(c => (
                                                <option key={c.course_id} value={c.course_id}>{c.name}</option>
                                            ))}
                                            {courses.length === 0 && (
                                                <>
                                                    <option value="B.Tech Computer Science - Sem 1">B.Tech Computer Science - Sem 1</option>
                                                    <option value="BCA - Sem 1">BCA - Sem 1</option>
                                                    <option value="BBA - Sem 1">BBA - Sem 1</option>
                                                    <option value="B.Sc Information Tech - Sem 1">B.Sc Information Tech - Sem 1</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Date of Admission</label>
                                        <input name="admissionDate" required type="date" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="space-y-4 md:col-start-2 md:row-start-1 md:row-span-2">
                                    <h3 className="text-white text-sm font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2">Personal Identity</h3>
                                    <div className="flex space-x-3">
                                        <div className="w-1/2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">First Name</label>
                                            <input name="firstName" required type="text" placeholder="e.g. Rahul" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Last Name</label>
                                            <input name="lastName" required type="text" placeholder="e.g. Sharma" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Date of Birth</label>
                                        <input name="dob" required type="date" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Parent/Guardian Name</label>
                                        <input name="parent" required type="text" placeholder="e.g. Rajeev Sharma" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-white text-sm font-bold uppercase tracking-widest border-b border-[rgba(255,255,255,0.1)] pb-2 mt-2">Contact Directory</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Primary Email (System Comms)</label>
                                            <input name="email" required type="email" placeholder="student@example.com" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Mobile Contact</label>
                                            <input name="phone" required type="tel" placeholder="+91 XXXXX XXXXX" className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Permanent Residential Address</label>
                                            <textarea name="address" required rows="2" placeholder="Street layout, city, postal logic..." className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none resize-none"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end space-x-3 mt-4 border-t border-[rgba(255,255,255,0.1)]">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-colors">Cancel</button>
                                <button type="submit" className="bg-[var(--gu-gold)] text-[#1A0505] px-8 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm shadow-xl shadow-[var(--gu-gold)]/20">Finalize Enrollment &rarr;</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Student Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-3xl my-8 overflow-hidden shadow-2xl animate-fade-in relative">
                        <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A] sticky top-0 z-10">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-sm bg-[var(--gu-gold)] text-[#1A0505] flex items-center justify-center font-bold text-2xl uppercase shadow-md shadow-black">
                                    {selectedStudent.name.replace(/[^a-zA-Z]/g, '').substring(0,2)}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-3 text-white font-serif text-2xl leading-none pt-1">
                                        <h2>{selectedStudent.name}</h2>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-sans tracking-widest rounded flex items-center h-5 ${selectedStudent.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : selectedStudent.status==='Graduating' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {selectedStudent.status} {selectedStudent.status === 'Suspended' && <AlertTriangle className="w-3 h-3 ml-1" />}
                                        </span>
                                    </div>
                                    <span className="text-[var(--gu-gold)] text-xs font-mono tracking-widest mt-1 block">{selectedStudent.enrollment_no} • Enrolled {new Date(selectedStudent.admissionDate || new Date()).getFullYear()}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            
                            {/* Detailed Grid Map */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Course & Progression</p>
                                    <p className="text-white text-base">{selectedStudent.course.split(' - ')[0]}</p>
                                    <p className="text-gray-400 text-sm mt-0.5">{selectedStudent.course.split(' - ')[1] || "Term Pending"}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Parental / Guardian Mapping</p>
                                    <p className="text-white text-base">{selectedStudent.parent || "Data not on file"}</p>
                                    <p className="text-gray-400 text-sm mt-0.5">Relation: Parent</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">System Comm Email</p>
                                    <p className="text-white text-sm break-all">{selectedStudent.email || "N/A"}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Primary Phone / Mobile</p>
                                    <p className="text-white text-sm">{selectedStudent.phone || "N/A"}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Date of Birth</p>
                                    <p className="text-white text-sm">{selectedStudent.dob || "Unknown"}</p>
                                </div>
                                <div className="bg-[#3D0F0F] p-4 border border-[rgba(255,255,255,0.05)] rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gu-gold)] font-bold mb-1 opacity-80">Declared Address</p>
                                    <p className="text-white text-sm line-clamp-2">{selectedStudent.address || "No address traced."}</p>
                                </div>
                            </div>
                            
                            {/* Operations */}
                            <div className="pt-6 border-t border-[rgba(255,255,255,0.1)] flex flex-wrap justify-end gap-3 rounded-sm">
                                {selectedStudent.status === 'Active' || selectedStudent.status === 'Graduating' ? (
                                    <button 
                                        onClick={() => handleSuspend(selectedStudent.enrollment_no, selectedStudent.user_id)}
                                        className="border border-red-500 text-red-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors rounded-sm flex items-center"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" /> Suspend Account
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleActivate(selectedStudent.enrollment_no, selectedStudent.user_id)}
                                        className="border border-green-500 text-green-400 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-500 hover:text-white transition-colors rounded-sm flex items-center"
                                    >
                                        Activate Profile
                                    </button>
                                )}
                                <button className="border border-[var(--gu-gold)] text-[var(--gu-gold)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[var(--gu-gold)] hover:text-[#1A0505] transition-colors rounded-sm shadow-md cursor-not-allowed opacity-50">
                                    Edit Core Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Students;
