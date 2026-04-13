import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Bell, Send, Users, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useEffect } from 'react';
import { adminAPI } from '../../services/api';

const Notifications = () => {
    const [history, setHistory] = useState([]);
    const [form, setForm] = useState({
        target: "All Students",
        type: "Dashboard Alert",
        priority: "Normal",
        title: "",
        message: ""
    });

    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await adminAPI.notifications();
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };
        fetchHistory();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await adminAPI.createNotification(form);
            alert(`Trigger: Notification successfully dispatched to ${form.target}.`);
            setForm({ ...form, title: "", message: "" });
            const res = await adminAPI.notifications();
            setHistory(res.data);
        } catch (error) {
            alert("Failed to fire broadcast");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in max-w-7xl mx-auto flex flex-col space-y-8 h-[calc(100vh-100px)]">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-8 rounded-2xl border border-[var(--gu-gold)]/10 backdrop-blur-sm shrink-0">
                    <div>
                        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">System Broadcasts</h1>
                        <p className="text-[var(--gu-gold)] text-[10px] uppercase tracking-[0.4em] font-black opacity-80">
                            Notification Center · Global Dispatches
                        </p>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 pb-6">
                    {/* Broadcast Form */}
                    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col animate-slide-up">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h2 className="text-white font-serif text-xl flex items-center gap-3">
                                <Send className="w-5 h-5 text-[var(--gu-gold)]"/> Compose Broadcast
                            </h2>
                        </div>
                        <form onSubmit={handleSend} className="p-8 space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gu-gold)] mb-3 opacity-60">Target Audience</label>
                                    <select 
                                        value={form.target} 
                                        onChange={(e) => setForm({...form, target: e.target.value})} 
                                        className="w-full bg-[#1A0505] border border-white/10 text-white rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[var(--gu-gold)]/30 outline-none transition-all"
                                    >
                                        <option>All Students</option>
                                        <option>All Faculty</option>
                                        <option>Computer Science Dept</option>
                                        <option>Information Tech Dept</option>
                                        <option>BCA 1st Year Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gu-gold)] mb-3 opacity-60">Delivery Channel</label>
                                    <select 
                                        value={form.type} 
                                        onChange={(e) => setForm({...form, type: e.target.value})} 
                                        className="w-full bg-[#1A0505] border border-white/10 text-white rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[var(--gu-gold)]/30 outline-none transition-all"
                                    >
                                        <option>Dashboard Alert</option>
                                        <option>Email Blast</option>
                                        <option>Push Notification</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gu-gold)] mb-4 opacity-60">Priority Level</label>
                                <div className="flex gap-3">
                                    {['Normal', 'Important', 'Urgent'].map(level => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setForm({...form, priority: level})}
                                            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                                form.priority === level 
                                                ? (level === 'Urgent' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                                   : level === 'Important' ? 'bg-[var(--gu-gold)] text-black border-[var(--gu-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                                                   : 'bg-white/10 text-white border-white/20')
                                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gu-gold)] mb-3 opacity-60">Notification Title</label>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="Enter clear subject line..." 
                                    value={form.title} 
                                    onChange={(e) => setForm({...form, title: e.target.value})} 
                                    className="w-full bg-[#1A0505] border border-white/10 text-white rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[var(--gu-gold)]/30 outline-none transition-all" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gu-gold)] mb-3 opacity-60">Message Body</label>
                                <textarea 
                                    required 
                                    rows="4" 
                                    placeholder="Type your broadcast message here..." 
                                    value={form.message} 
                                    onChange={(e) => setForm({...form, message: e.target.value})} 
                                    className="w-full bg-[#1A0505] border border-white/10 text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-[var(--gu-gold)]/30 outline-none transition-all resize-none"
                                ></textarea>
                                <div className="flex justify-between mt-2">
                                    <span className="text-[10px] text-white/30 italic font-medium">Keep it concise and clear.</span>
                                    <span className={`text-[10px] font-bold ${form.message.length > 450 ? 'text-red-400' : 'text-white/40'}`}>
                                        {form.message.length} / 500
                                    </span>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSending}
                                className="w-full bg-[var(--gu-gold)] text-black py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#e6c949] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex justify-center items-center disabled:opacity-50 group overflow-hidden relative"
                            >
                                <span className="relative z-10">{isSending ? 'Dispatching Payload...' : 'Fire Broadcast'}</span>
                                <div className="absolute inset-x-0 h-full w-20 bg-white/20 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[500%] transition-transform duration-1000"></div>
                            </button>
                        </form>
                    </div>

                    {/* Broadcast History */}
                    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col animate-slide-up animate-stagger-1">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h2 className="text-white font-serif text-xl flex items-center gap-3">
                                <Bell className="w-5 h-5 text-white/40"/> Recent Dispatches
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 py-20">
                                    <Search className="w-12 h-12" />
                                    <p className="font-serif text-xl">History Empty</p>
                                </div>
                            ) : history.map((item, i) => (
                                <div 
                                    key={item.notification_id} 
                                    className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 hover:border-[var(--gu-gold)]/20 transition-all group overflow-hidden relative"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${item.priority === 'Urgent' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.priority} Priority</span>
                                            </div>
                                            <h3 className="text-white font-serif text-lg tracking-tight group-hover:text-[var(--gu-gold)] transition-colors">{item.title}</h3>
                                        </div>
                                        <span className="text-[9px] text-[var(--gu-gold)] font-black uppercase tracking-widest px-3 py-1.5 border border-[var(--gu-gold)]/20 rounded-full flex-shrink-0 flex items-center bg-[var(--gu-gold)]/5">
                                            {item.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-4 text-[10px] font-bold text-white/60 mb-4 py-3 border-y border-white/5 relative z-10">
                                        <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5 opacity-40" /> {item.target}</span>
                                        <span className="flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1.5 opacity-40" /> {item.type}</span>
                                    </div>
                                    
                                    <p className="text-white/40 text-[10px] font-medium tracking-wide flex justify-between relative z-10">
                                        <span>Dispatch ID: #{item.notification_id.toString().slice(-6)}</span>
                                        <span>{new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </p>
                                    
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gu-gold)]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[var(--gu-gold)]/10 transition-all duration-700"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Notifications;
