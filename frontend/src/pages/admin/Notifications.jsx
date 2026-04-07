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
            <div className="animate-fade-in max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)]">
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 shrink-0">
                    <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 word-wrap break-words">System Broadcasts</h1>
                    <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                        Push Notifications & Targeted Messaging
                    </p>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden pb-4">
                    {/* Broadcast Form */}
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-y-auto">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#2D0A0A]">
                            <h2 className="text-white font-serif text-xl flex items-center">
                                <Send className="w-5 h-5 mr-3 text-[var(--gu-gold)]"/> Compose Broadcast
                            </h2>
                        </div>
                        <form onSubmit={handleSend} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Target Audience</label>
                                    <select value={form.target} onChange={(e) => setForm({...form, target: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                        <option>All Students</option>
                                        <option>All Faculty</option>
                                        <option>Computer Science Dept</option>
                                        <option>Information Tech Dept</option>
                                        <option>BCA 1st Year Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Delivery Channel</label>
                                    <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none">
                                        <option>Dashboard Alert</option>
                                        <option>Email Blast</option>
                                        <option>Push Notification (Mobile)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Priority Level</label>
                                <div className="flex space-x-4">
                                    {['Normal', 'Important', 'Urgent'].map(level => (
                                        <label key={level} className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="priority" 
                                                checked={form.priority === level}
                                                onChange={() => setForm({...form, priority: level})}
                                                className="accent-[var(--gu-gold)]"
                                            />
                                            <span className={`text-sm ${
                                                level === 'Urgent' ? 'text-red-400' : 
                                                level === 'Important' ? 'text-[var(--gu-gold)]' : 
                                                'text-gray-300'
                                            }`}>{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Notification Title</label>
                                <input required type="text" placeholder="Enter clear subject line..." value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Message Body</label>
                                <textarea required rows="6" placeholder="Type your broadcast message here..." value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none resize-none"></textarea>
                                <p className="text-right text-xs text-gray-500 mt-1">{form.message.length}/500 chars</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSending}
                                className="w-full bg-[var(--gu-gold)] text-[#1A0505] py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm flex justify-center items-center disabled:opacity-50"
                            >
                                {isSending ? 'Dispatching Payload...' : 'Fire Broadcast'}
                            </button>
                        </form>
                    </div>

                    {/* Broadcast History */}
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#2D0A0A] flex justify-between items-center">
                            <h2 className="text-white font-serif text-xl flex items-center">
                                <Bell className="w-5 h-5 mr-3 text-gray-400"/> Recent Dispatches
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {history.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No broadcasts found in history.</p>
                            ) : history.map(item => (
                                <div key={item.notification_id} className="bg-[#3D0F0F] border border-[rgba(255,255,255,0.05)] p-4 hover:border-[rgba(212,175,55,0.2)] transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-white font-medium text-sm pr-4">{item.title}</h3>
                                        <span className="text-[10px] text-green-400 uppercase tracking-widest px-2 py-0.5 bg-green-400/10 rounded flex-shrink-0 flex items-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> {item.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap text-xs text-gray-400 gap-y-2">
                                        <span className="flex items-center mr-4 w-full md:w-auto"><Users className="w-3 h-3 mr-1" /> {item.target}</span>
                                        <span className="flex items-center w-full md:w-auto"><AlertCircle className="w-3 h-3 mr-1" /> {item.type}</span>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">{new Date(item.created_at).toLocaleString()}</p>
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
