import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { authAPI } from '../services/api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('Authenticating...');
        setLoading(true);

        // Clear existing stale tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('profile');

        try {
            const response = await authAPI.login(email, password);
            const { access, refresh, user, profile } = response.data;
            
            if (user.role !== 'admin') {
                setMessage('Access denied. Admin credentials required.');
                setLoading(false);
                return;
            }

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('profile', JSON.stringify(profile));
            navigate('/admin/dashboard', { replace: true });
        } catch (error) {
            console.error('API Login Failed:', error);
            if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
            } else {
                setMessage('Authentication failed. Please check credentials or server connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A0505] font-sans px-4">
            <div className="w-full max-w-sm animate-fade-in">
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="mb-4"><Logo size="lg" /></div>
                    <h1 className="font-serif text-3xl font-bold text-white mb-2">Administrator Access</h1>
                    <p className="text-[var(--gu-red)] text-xs uppercase tracking-widest font-bold">
                        Ganpat University ERP — Restricted Area
                    </p>
                </div>

                <div className="bg-[#2D0A0A] border border-[var(--gu-gold)] p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                Admin Email
                            </label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-none placeholder-gray-600"
                                placeholder="admin@gnu.ac.in"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white focus:outline-none focus:border-[var(--gu-gold)] transition-colors rounded-none placeholder-gray-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 mt-2 bg-[var(--gu-gold)] text-[#1A0505] text-sm font-bold uppercase tracking-widest rounded-none shadow-none hover:bg-[#e6c949] transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Authenticating...' : 'Access System'}
                        </button>
                    </form>

                    {message && (
                        <p className="mt-6 text-center text-xs font-semibold text-[var(--gu-gold)] border border-[var(--gu-gold)] py-2 bg-[rgba(212,175,55,0.1)]">
                            {message}
                        </p>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link to="/" className="text-gray-500 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white pb-1">
                        &larr; Return to main portal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
