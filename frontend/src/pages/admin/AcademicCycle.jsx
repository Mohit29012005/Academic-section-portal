import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Server, CalendarDays, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { adminAPI } from '../../services/api';

const AcademicCycle = () => {
    const [terms, setTerms] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [currentTerm, setCurrentTerm] = useState("Loading...");

    const [showNewTermModal, setShowNewTermModal] = useState(false);
    const [showNewHolidayModal, setShowNewHolidayModal] = useState(false);

    const [termForm, setTermForm] = useState({ name: "", start: "", end: "" });
    const [holidayForm, setHolidayForm] = useState({ date: "", name: "", type: "National" });



    useEffect(() => {
        const fetchData = async () => {
            try {
                const [termsRes, holidaysRes] = await Promise.all([
                    adminAPI.terms(),
                    adminAPI.holidays()
                ]);
                setTerms(termsRes.data);
                setHolidays(holidaysRes.data);
                const active = termsRes.data.find(t => t.status === 'Active');
                if (active) setCurrentTerm(active.name);
                else setCurrentTerm("No Active Term");
            } catch (error) {
                console.error("Failed to fetch academic cycle data", error);
                setCurrentTerm("Error loading backend context");
            }


        };
        fetchData();
    }, []);

    const handleCreateTerm = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.createTerm({ name: termForm.name, start_date: termForm.start, end_date: termForm.end, status: 'Upcoming' });
            alert("New Semester Declared Successfully.");
            setShowNewTermModal(false);
            setTermForm({ name: "", start: "", end: "" });
            const res = await adminAPI.terms();
            setTerms(res.data);
        } catch (error) { alert("Error creating term"); }
    };

    const handleCreateHoliday = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.createHoliday({ date: holidayForm.date, name: holidayForm.name, type: holidayForm.type });
            alert("Holiday added to Academic Calendar.");
            setShowNewHolidayModal(false);
            setHolidayForm({ date: "", name: "", type: "National" });
            const res = await adminAPI.holidays();
            setHolidays(res.data);
        } catch (error) { alert("Error adding holiday: " + (error.response?.data?.error || error.message)); }
    };

    const activateTerm = async (id, name) => {
        try {
            await adminAPI.updateTerm(id, { status: 'Active' });
            setCurrentTerm(name);
            alert(`Academic Engine switched to ${name}.`);
            const res = await adminAPI.terms();
            setTerms(res.data);
        } catch (error) { alert("Error updating term"); }
    };

    const removeTerm = async (id) => {
        if (!window.confirm("Are you sure you want to delete this semester configuration? This cannot be undone.")) return;
        try {
            await adminAPI.deleteTerm(id);
            alert("Semester configuration deleted.");
            const res = await adminAPI.terms();
            setTerms(res.data);
            const active = res.data.find(t => t.status === 'Active');
            setCurrentTerm(active ? active.name : "No Active Term");
        } catch (error) { alert("Error deleting term: " + (error.response?.data?.error || error.message)); }
    };

    const removeHoliday = async (id) => {
        try {
            await adminAPI.deleteHoliday(id);
            const res = await adminAPI.holidays();
            setHolidays(res.data);
        } catch (error) { alert("Error deleting holiday"); }
    };


    return (
        <AdminLayout>
            <div className="animate-fade-in max-w-7xl mx-auto">
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 word-wrap break-words">Academic Cycle & Calendar</h1>
                        <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                            Global Semesters, Term Bounds, & Holidays
                        </p>
                    </div>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Semester Management Panel */}
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#2D0A0A] flex justify-between items-center">
                            <h2 className="text-white font-serif text-xl flex items-center">
                                <Server className="w-5 h-5 mr-3 text-[#60a5fa]"/> Semester Configuration
                            </h2>
                            <button onClick={() => setShowNewTermModal(true)} className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-bold hover:text-white flex items-center">
                                <Plus className="w-4 h-4 mr-1"/> Add Term
                            </button>
                        </div>
                        <div className="p-6 flex-1 space-y-4">
                            <div className="bg-[#3D0F0F] border border-[#60a5fa]/30 p-4 rounded-sm flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-[#60a5fa] font-bold mb-1">Global Active Term</p>
                                    <p className="text-white text-lg font-semibold">{currentTerm}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-[#60a5fa]" />
                            </div>

                            {terms.map(term => (
                                <div key={term.term_id} className="border border-[rgba(255,255,255,0.05)] p-4 flex justify-between items-center hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                    <div>
                                        <h3 className="text-white font-medium">{term.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono mt-1">{term.start_date} to {term.end_date}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold ${
                                            term.status === 'Active' ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 
                                            term.status === 'Upcoming' ? 'bg-[var(--gu-gold)]/20 text-[var(--gu-gold)]' : 
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {term.status}
                                        </span>
                                        {term.status === 'Upcoming' && (
                                            <button onClick={() => activateTerm(term.term_id, term.name)} className="text-xs text-[#60a5fa] hover:text-white underline">Make Active</button>
                                        )}
                                        <button onClick={() => removeTerm(term.term_id)} className="text-red-400/50 hover:text-red-400 transition-colors p-1" title="Delete Term">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Holiday Calendar Data Panel */}
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#2D0A0A] flex justify-between items-center">
                            <h2 className="text-white font-serif text-xl flex items-center">
                                <CalendarDays className="w-5 h-5 mr-3 text-[var(--gu-gold)]"/> Holiday Calendar
                            </h2>
                            <button onClick={() => setShowNewHolidayModal(true)} className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-bold hover:text-white flex items-center">
                                <Plus className="w-4 h-4 mr-1"/> Declare
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {holidays.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No holidays declared for this cycle.</p>
                            ) : (
                                <div className="space-y-3">
                                    {holidays.map(h => (
                                        <div key={h.holiday_id} className="bg-[#3D0F0F] border border-[rgba(255,255,255,0.05)] p-3 flex justify-between items-center">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-[#1A0505] text-[var(--gu-gold)] font-mono text-xs px-2 py-2 border border-[rgba(212,175,55,0.3)] text-center w-16">
                                                    <div>{new Date(h.date).getDate()}</div>
                                                    <div className="uppercase">{new Date(h.date).toLocaleString('default', { month: 'short' })}</div>
                                                </div>
                                                <div>
                                                    <h3 className="text-white text-sm font-semibold">{h.name}</h3>
                                                    <span className="text-xs text-gray-400 tracking-wider uppercase inline-block mt-1">{h.type}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeHoliday(h.holiday_id)} className="text-red-400/50 hover:text-red-400 transition-colors p-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* New Semester Modal */}
            {showNewTermModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-lg min-w-[300px]">
                        <div className="p-4 border-b border-[var(--gu-gold)] bg-[#2D0A0A]">
                            <h2 className="text-[var(--gu-gold)] font-serif text-xl">Declare New Semester</h2>
                        </div>
                        <form onSubmit={handleCreateTerm} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Semester Name Identifier</label>
                                <input required type="text" placeholder="e.g. Even Semester 2027" value={termForm.name} onChange={(e) => setTermForm({...termForm, name: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Start Date</label>
                                    <input required type="date" value={termForm.start} onChange={(e) => setTermForm({...termForm, start: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">End Date</label>
                                    <input required type="date" value={termForm.end} onChange={(e) => setTermForm({...termForm, end: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3 mt-6 border-t border-[rgba(255,255,255,0.1)]">
                                <button type="button" onClick={() => setShowNewTermModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-colors">Cancel</button>
                                <button type="submit" className="bg-[var(--gu-gold)] text-[#1A0505] px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm">Create Term</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Holiday Modal */}
            {showNewHolidayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-lg min-w-[300px]">
                        <div className="p-4 border-b border-[var(--gu-gold)] bg-[#2D0A0A]">
                            <h2 className="text-[var(--gu-gold)] font-serif text-xl">Declare Holiday Break</h2>
                        </div>
                        <form onSubmit={handleCreateHoliday} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Select Date</label>
                                <input required type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({...holidayForm, date: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Event Name</label>
                                <input required type="text" placeholder="e.g. Diwali Break" value={holidayForm.name} onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[var(--gu-gold)] mb-1">Holiday Type</label>
                                <select value={holidayForm.type} onChange={(e) => setHolidayForm({...holidayForm, type: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2 text-sm focus:border-[var(--gu-gold)] outline-none">
                                    <option>National</option>
                                    <option>Festival</option>
                                    <option>Institutional</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3 mt-6 border-t border-[rgba(255,255,255,0.1)]">
                                <button type="button" onClick={() => setShowNewHolidayModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white uppercase tracking-wider font-bold transition-colors">Cancel</button>
                                <button type="submit" className="bg-[var(--gu-gold)] text-[#1A0505] px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm">Add Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
};

export default AcademicCycle;
