import FacultyLayout from '../../components/FacultyLayout';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

const Schedule = () => {
    return (
        <FacultyLayout>
            <div className="animate-fade-in max-w-[1200px] mx-auto">

                {/* Page Header */}
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-6 word-wrap">
                    <h1 className="font-serif text-2xl md:text-3xl text-white mb-2 word-wrap break-words">Class Schedule</h1>
                    <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold word-wrap break-words">
                        Your weekly timetable as assigned by the department
                    </p>
                </div>

                {/* Note Banner */}
                <div className="flex items-start md:items-center bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 rounded-sm mb-8 gap-3">
                    <Info className="w-5 h-5 text-[var(--gu-gold)] flex-shrink-0 mt-0.5 md:mt-0" />
                    <p className="text-white text-sm md:text-base opacity-80 leading-relaxed word-wrap break-words flex-1">
                        Schedule is managed by the Academic Administrator. Contact <span className="text-[var(--gu-gold)] font-medium">admin@ganpatuniversity.ac.in</span> for changes.
                    </p>
                </div>

                {/* Week Navigation */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <button className="flex items-center justify-center w-full md:w-auto text-[var(--gu-gold)] hover:text-[#e6c949] transition-colors font-semibold uppercase tracking-wider text-xs md:text-sm bg-[rgba(207,181,59,0.05)] md:bg-transparent py-2 md:py-0 rounded-sm">
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 flex-shrink-0" /> Previous Week
                    </button>
                    <h2 className="font-serif text-white text-lg md:text-2xl text-center word-wrap break-words px-2">
                        Week of March 3 &ndash; March 8, 2026
                    </h2>
                    <button className="flex items-center justify-center w-full md:w-auto text-[var(--gu-gold)] hover:text-[#e6c949] transition-colors font-semibold uppercase tracking-wider text-xs md:text-sm bg-[rgba(207,181,59,0.05)] md:bg-transparent py-2 md:py-0 rounded-sm">
                        Next Week <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-1 flex-shrink-0" />
                    </button>
                </div>

                {/* Timetable Grid */}
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden mb-8 overflow-x-auto">
                    <table className="w-full text-left min-w-[800px] border-collapse">
                        <thead>
                            <tr className="bg-[#3D0F0F] border-b border-[var(--gu-gold)]">
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[10%] text-center border-r border-[var(--gu-border-red)]">Time</th>
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[15%] text-center border-r border-[var(--gu-border-red)]">Monday</th>
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[15%] text-center border-r border-[var(--gu-border-red)]">Tuesday</th>
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[15%] text-center border-r border-[var(--gu-border-red)]">Wednesday</th>
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[15%] text-center border-r border-[var(--gu-border-red)]">Thursday</th>
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[15%] text-center border-r border-[var(--gu-border-red)]">Friday</th>
                                <th className="p-3 text-[var(--gu-gold)] font-serif text-sm uppercase tracking-widest w-[15%] text-center">Saturday</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 09:00 */}
                            <tr className="border-b border-[var(--gu-border-red)]">
                                <td className="p-3 text-[var(--gu-gold)] bg-[#3D0F0F] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">09:00</td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Data Structures</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 301 &middot; Sec A</div>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Data Structures</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 301 &middot; Sec B</div>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Data Structures</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 301 &middot; Sec A</div>
                                    </div>
                                </td>
                                <td className="p-3"></td>
                            </tr>

                            {/* 10:00 */}
                            <tr className="border-b border-[var(--gu-border-red)]">
                                <td className="p-3 text-[var(--gu-gold)] bg-[#3D0F0F] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">10:00</td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Web Development</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 302 &middot; Sec A</div>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Algorithms</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 305 &middot; Sec C</div>
                                    </div>
                                </td>
                            </tr>

                            {/* 11:00 */}
                            <tr className="border-b border-[var(--gu-border-red)]">
                                <td className="p-3 text-[var(--gu-gold)] bg-[#3D0F0F] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">11:00</td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Web Development</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 302 &middot; Sec B</div>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3"></td>
                            </tr>

                            {/* 12:00 Break */}
                            <tr className="border-b border-[var(--gu-border-red)] bg-[#3D0F0F]">
                                <td className="p-3 text-[var(--gu-gold)] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">12:00</td>
                                <td colSpan="6" className="p-3 text-center text-white opacity-50 uppercase tracking-widest text-sm font-semibold">Lunch Break</td>
                            </tr>

                            {/* 01:00 */}
                            <tr className="border-b border-[var(--gu-border-red)]">
                                <td className="p-3 text-[var(--gu-gold)] bg-[#3D0F0F] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">01:00</td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Algorithms</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 305 &middot; Sec B</div>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3"></td>
                            </tr>

                            {/* 02:00 */}
                            <tr className="border-b border-[var(--gu-border-red)]">
                                <td className="p-3 text-[var(--gu-gold)] bg-[#3D0F0F] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">02:00</td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)] align-top min-h-[80px]">
                                    <div className="bg-[rgba(207,181,59,0.12)] border-l-3 border-[var(--gu-gold)] p-2 rounded-sm h-full flex flex-col justify-center">
                                        <div className="text-white text-sm font-semibold mb-1">Algorithms</div>
                                        <div className="text-[var(--gu-gold)] text-xs">Room 305 &middot; Sec A</div>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3"></td>
                            </tr>

                            {/* 03:00 */}
                            <tr>
                                <td className="p-3 text-[var(--gu-gold)] bg-[#3D0F0F] text-sm font-semibold text-center border-r border-[var(--gu-border-red)]">03:00</td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3 border-r border-[var(--gu-border-red)]"></td>
                                <td className="p-3"></td>
                            </tr>

                        </tbody>
                    </table>
                </div>

                {/* Today's Summary Strip */}
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 rounded-sm flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <span className="text-[var(--gu-gold)] font-serif text-lg md:font-semibold md:font-sans md:text-base uppercase tracking-wider">
                        Today's Classes:
                    </span>
                    <div className="flex flex-wrap gap-3">
                        <span className="bg-[rgba(250,247,242,0.1)] text-white px-3 py-1.5 rounded-sm text-sm border border-[rgba(250,247,242,0.2)]">
                            Data Structures &mdash; 9:00 AM &mdash; Room 301
                        </span>
                        <span className="bg-[rgba(250,247,242,0.1)] text-white px-3 py-1.5 rounded-sm text-sm border border-[rgba(250,247,242,0.2)]">
                            Algorithms &mdash; 1:00 PM &mdash; Room 305
                        </span>
                    </div>
                </div>

            </div>
        </FacultyLayout>
    );
};

export default Schedule;
