// ─── State ───
let selectedExamType = 'external';
let currentPaper = null;

// ─── DOM Elements ───
const semesterSelect = document.getElementById('semesterSelect');
const subjectSelect = document.getElementById('subjectSelect');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const paperPreview = document.getElementById('paperPreview');
const paperContent = document.getElementById('paperContent');
const subjectInfo = document.getElementById('subjectInfo');
const btnExternal = document.getElementById('btnExternal');
const btnInternal = document.getElementById('btnInternal');

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    loadSemesters();
    setupExamTypeToggle();
    generateBtn.addEventListener('click', generatePaper);
    downloadBtn.addEventListener('click', downloadPDF);
});

// ─── Load Semesters ───
async function loadSemesters() {
    try {
        const res = await fetch('/api/semesters');
        const sems = await res.json();
        semesterSelect.innerHTML = '<option value="" disabled selected>Select Semester</option>';
        sems.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = `Semester ${s}`;
            semesterSelect.appendChild(opt);
        });
        semesterSelect.addEventListener('change', () => loadSubjects(semesterSelect.value));
    } catch(e) {
        console.error('Failed to load semesters:', e);
    }
}

// ─── Load Subjects ───
async function loadSubjects(semester) {
    subjectSelect.disabled = true;
    subjectSelect.innerHTML = '<option>Loading...</option>';
    generateBtn.disabled = true;
    paperPreview.style.display = 'none';
    subjectInfo.style.display = 'none';

    try {
        const res = await fetch(`/api/subjects/${semester}`);
        const subjects = await res.json();
        subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject</option>';
        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.code;
            opt.textContent = `[${sub.code}] ${sub.name}`;
            opt.dataset.name = sub.name;
            subjectSelect.appendChild(opt);
        });
        subjectSelect.disabled = false;
        subjectSelect.addEventListener('change', onSubjectChange);
    } catch(e) {
        subjectSelect.innerHTML = '<option>Error loading</option>';
    }
}

function onSubjectChange() {
    const opt = subjectSelect.options[subjectSelect.selectedIndex];
    if (!opt || !opt.value) return;
    generateBtn.disabled = false;
    paperPreview.style.display = 'none';
    const marks = selectedExamType === 'external' ? 60 : 30;

    document.getElementById('infoCode').textContent = opt.value;
    document.getElementById('infoName').textContent = opt.dataset.name || opt.value;
    document.getElementById('infoType').textContent = selectedExamType === 'external' ? 'External' : 'Internal';
    document.getElementById('infoMarks').textContent = marks + ' Marks';
    subjectInfo.style.display = 'grid';
}

// ─── Exam Type Toggle ───
function setupExamTypeToggle() {
    [btnExternal, btnInternal].forEach(btn => {
        btn.addEventListener('click', () => {
            btnExternal.classList.remove('active');
            btnInternal.classList.remove('active');
            btn.classList.add('active');
            selectedExamType = btn.dataset.type;
            onSubjectChange(); // refresh info card
        });
    });
}

// ─── Generate Paper ───
async function generatePaper() {
    const semester = semesterSelect.value;
    const subjectCode = subjectSelect.value;
    if (!semester || !subjectCode) return;

    // Show loader
    generateBtn.querySelector('.btn-text').style.display = 'none';
    generateBtn.querySelector('.btn-loader').style.display = 'flex';
    generateBtn.querySelector('.btn-icon').style.display = 'none';
    generateBtn.disabled = true;

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ semester: parseInt(semester), subject_code: subjectCode, exam_type: selectedExamType })
        });
        if (!res.ok) { alert('Failed to generate paper!'); return; }
        currentPaper = await res.json();
        renderPaperPreview(currentPaper);
        paperPreview.style.display = 'block';
        paperPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch(e) {
        alert('Error: ' + e.message);
    } finally {
        generateBtn.querySelector('.btn-text').style.display = '';
        generateBtn.querySelector('.btn-loader').style.display = 'none';
        generateBtn.querySelector('.btn-icon').style.display = '';
        generateBtn.disabled = false;
    }
}

// ─── Render Paper Preview ───
function renderPaperPreview(paper) {
    const isExternal = paper.exam_type === 'External';
    const now = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const letters = 'ABCDEFGHI';
    const roman = ['I', 'II', 'III', 'IV', 'V'];

    function badge(imp) {
        if (imp === 'HIGH') return `<span class="q-badge high">★ HIGH</span>`;
        if (imp === 'MEDIUM') return `<span class="q-badge medium">◆ MED</span>`;
        return '';
    }

    function qRow(label, text, marks, importance) {
        return `<div class="p-question">
            <span class="q-label">${label}</span>
            <span class="q-text">${text}${badge(importance)}</span>
            ${marks ? `<span class="q-marks">${marks}</span>` : ''}
        </div>`;
    }

    let html = `
    <div class="p-enrollment">Enrollment No._______________</div>
    <div class="p-university">GANPAT UNIVERSITY</div>
    <div class="p-exam">B.C.A. SEM-${paper.semester} EXAMINATION (CBCS)</div>
    <div class="p-subject">${paper.subject_code}: ${paper.subject_name}</div>
    <div class="p-session">${paper.exam_type} Examination &ndash; ${now}</div>
    <div class="p-meta">
        <span>Time: ${paper.time}</span>
        <span>[Total Marks: ${paper.total_marks}]</span>
    </div>
    <div class="p-instructions">
        <strong>Instructions:</strong>
        <ol>
            <li>Figures to the right indicate full marks.</li>
            <li>Each section should be written in a separate answer book.</li>
            <li>Be precise and to the point in your answer.</li>
        </ol>
    </div>
    <div class="p-line"></div>

    <!-- SECTION-I -->
    <div class="p-section-title">SECTION-I</div>
    <div class="p-q-header">
        <span><b>1</b>&nbsp;&nbsp;&nbsp;Answer the following: (Any six out of Nine)</span>
        <span class="marks">(30)</span>
    </div>`;

    (paper.section1 || []).slice(0, 9).forEach((q, i) => {
        html += qRow(`${letters[i]})`, q.question, '(05)', q.importance);
    });

    if (isExternal) {
        html += `<div class="p-line"></div>
        <div class="p-section-title">SECTION-II</div>

        <!-- Q2 -->
        <div class="p-q-header"><span><b>2</b></span></div>
        <div class="p-q-sub-header">
            <span>(A)&nbsp; Answer the following: (Any One)</span>
            <span>(06)</span>
        </div>`;
        (paper.q2a || []).slice(0, 2).forEach((q, i) => {
            html += qRow(`&nbsp;&nbsp;&nbsp;&nbsp;${roman[i]})`, q.question, '', q.importance);
        });

        html += `<div class="p-q-sub-header" style="margin-top:10px;">
            <span>(B)&nbsp; Answer the following:</span>
            <span>(02)</span>
        </div>`;
        (paper.q2b || []).slice(0, 2).forEach((q, i) => {
            html += qRow(`&nbsp;&nbsp;&nbsp;&nbsp;${roman[i]})`, q.question, '(01)', q.importance);
        });

        // Q3
        html += `<div class="p-q-header" style="margin-top:14px;">
            <span><b>3</b>&nbsp;&nbsp;&nbsp;Answer the following: (Any One)</span>
            <span class="marks">(06)</span>
        </div>`;
        (paper.q3 || []).slice(0, 2).forEach((q, i) => {
            html += qRow(`${roman[i]})`, q.question, '', q.importance);
        });

        // Q4
        html += `<div class="p-q-header" style="margin-top:14px;">
            <span><b>4</b>&nbsp;&nbsp;&nbsp;Answer the following: (Any Two)</span>
            <span class="marks">(10)</span>
        </div>`;
        (paper.q4 || []).slice(0, 3).forEach((q, i) => {
            html += qRow(`${roman[i]})`, q.question, '(05)', q.importance);
        });

        // Q5
        html += `<div class="p-q-header" style="margin-top:14px;">
            <span><b>5</b>&nbsp;&nbsp;&nbsp;Answer the following: (Any One)</span>
            <span class="marks">(06)</span>
        </div>`;
        (paper.q5 || []).slice(0, 2).forEach((q, i) => {
            html += qRow(`${roman[i]})`, q.question, '', q.importance);
        });
    }

    html += `<div class="p-line"></div>
    <div class="p-end">--- End of Paper ---</div>`;

    paperContent.innerHTML = html;
}

// ─── Download PDF ───
async function downloadPDF() {
    if (!currentPaper) return;
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ Generating...';

    try {
        const res = await fetch('/api/download-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentPaper)
        });
        if (!res.ok) { alert('PDF generation failed!'); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BCA_Sem${currentPaper.semester}_${currentPaper.subject_code}_${currentPaper.exam_type}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) {
        alert('Error: ' + e.message);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Download PDF`;
    }
}
