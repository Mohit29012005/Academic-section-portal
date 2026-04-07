/* ============================================================
   EVOLVEX AI — app.js  (All 5 Features + LLM Integration)
   ============================================================ */

'use strict';

// ── Global quiz state ─────────────────────────────────────────
let _quiz = [];
let _quizAnswers = {};

// ── Tab navigation ────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const section = document.getElementById('tab-' + name);
  if (section) section.classList.add('active');
  const tab = document.querySelector(`[data-tab="${name}"]`);
  if (tab) tab.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.showTab = showTab;

// ── Navbar scroll ─────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── Status helpers ────────────────────────────────────────────
function setStatus(id, msg, type = 'info') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-bar' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
}
function clearStatus(id) { setStatus(id, ''); }

// ── Loading state for buttons ─────────────────────────────────
function setLoading(btnId, loading, loadingText = 'Loading…') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  const textEl = btn.querySelector('.btn-text');
  if (loading) {
    btn.dataset.origText = textEl ? textEl.textContent : btn.textContent;
    if (textEl) textEl.textContent = loadingText;
  } else {
    if (textEl && btn.dataset.origText) textEl.textContent = btn.dataset.origText;
  }
}

// ── API helper ────────────────────────────────────────────────
async function fetchAPI(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

// ══════════════════════════════════════════════════════════════
//   TAB 1: FIT ANALYZER
// ══════════════════════════════════════════════════════════════

// Drop zones
function setupDropZone(dzId, fileId, fileNameId) {
  const dz = document.getElementById(dzId);
  const fi = document.getElementById(fileId);
  const fn = document.getElementById(fileNameId);
  if (!dz || !fi) return;
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag-over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag-over'); }));
  dz.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) { const dt = new DataTransfer(); dt.items.add(file); fi.files = dt.files; fn.textContent = file.name; fn.classList.add('has-file'); }
  });
  fi.addEventListener('change', () => { if (fi.files[0]) { fn.textContent = fi.files[0].name; fn.classList.add('has-file'); } });
}
setupDropZone('resumeDropZone', 'resumeFile', 'resumeFileName');
setupDropZone('jobDropZone', 'jobFile', 'jobFileName');

// Preview tab switcher
function switchPreviewTab(tab) {
  const isResume = tab === 'resume';
  document.getElementById('tabResume').classList.toggle('active', isResume);
  document.getElementById('tabJob').classList.toggle('active', !isResume);
  document.getElementById('resumePreview').classList.toggle('hidden', !isResume);
  document.getElementById('jobPreview').classList.toggle('hidden', isResume);
}
window.switchPreviewTab = switchPreviewTab;

// Score ring
const CIRC = 2 * Math.PI * 52;
function animateScore(score) {
  const ring = document.getElementById('ringFill');
  const num = document.getElementById('scoreNumber');
  ring.style.strokeDashoffset = CIRC - (score / 100) * CIRC;
  const start = performance.now();
  const dur = 1200;
  function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    num.textContent = (eased * score).toFixed(1) + '%';
    if (t < 1) requestAnimationFrame(tick); else num.textContent = score.toFixed(1) + '%';
  }
  requestAnimationFrame(tick);
}

function renderChips(containerId, items, chipClass = '') {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  if (!items || !items.length) { el.innerHTML = '<span class="chips-empty">None detected.</span>'; return; }
  items.forEach(item => {
    const c = document.createElement('span');
    c.className = 'chip' + (chipClass ? ' ' + chipClass : '');
    c.textContent = item;
    el.appendChild(c);
  });
}

function renderFitCourses(bySkill) {
  const el = document.getElementById('fitCoursesList');
  el.innerHTML = '';
  const skills = Object.keys(bySkill || {}).filter(s => bySkill[s]?.length);
  if (!skills.length) { el.innerHTML = '<p class="no-courses-msg">No course suggestions — your profile already covers these requirements.</p>'; return; }
  skills.forEach(skill => {
    const label = document.createElement('div'); label.className = 'course-group-label'; label.textContent = `Skill gap: ${skill}`; el.appendChild(label);
    bySkill[skill].forEach(c => {
      const item = document.createElement('div'); item.className = 'course-item';
      item.innerHTML = `<div class="course-name">${c.title}</div><div class="course-meta"><span class="course-platform">${c.platform}</span><span>${c.difficulty} · ${c.duration}</span></div>${c.url ? `<a class="course-link" href="${c.url}" target="_blank" rel="noopener noreferrer">View Course →</a>` : ''}`;
      el.appendChild(item);
    });
  });
}

async function analyze() {
  const resumeFile = document.getElementById('resumeFile').files[0];
  const jobFile = document.getElementById('jobFile').files[0];
  const resumeText = document.getElementById('resumeText').value.trim();
  const jobText = document.getElementById('jobText').value.trim();

  if (!resumeFile && !resumeText) { setStatus('fitStatus', 'Please upload or paste your resume.', 'error'); return; }
  if (!jobFile && !jobText) { setStatus('fitStatus', 'Please upload or paste the job description.', 'error'); return; }

  setLoading('analyzeBtn', true, 'Analyzing…');
  setStatus('fitStatus', 'Running ML pipeline — this may take a few seconds…');
  document.getElementById('fitResults').classList.remove('visible');

  try {
    // Always use FormData for consistent handling
    const fd = new FormData();
    if (resumeFile) {
      fd.append('resume', resumeFile);
    } else if (resumeText) {
      fd.append('resumeText', resumeText);
    }
    if (jobFile) {
      fd.append('jobDescription', jobFile);
    } else if (jobText) {
      fd.append('jobDescription', jobText);
    }
    
    const res = await fetch('/api/analyze/', { method: 'POST', body: fd });
    const response = await res.json().catch(() => ({ error: 'Invalid server response' }));
    if (!res.ok) throw new Error(response.error || 'Analysis failed');

    const score = response.matchScore ?? 0;
    animateScore(score);

    const fitVerdict = document.getElementById('fitVerdict');
    let vClass = '', vText = '';
    if (score >= 75) { vText = 'Strong Fit 🚀'; vClass = 'good'; }
    else if (score >= 45) { vText = 'Partial Fit ⚡'; vClass = 'medium'; }
    else { vText = 'Low Fit 🎯'; vClass = 'low'; }
    fitVerdict.textContent = vText; fitVerdict.className = 'fit-verdict ' + vClass;

    if (response.fit) {
      const conf = ((response.fit.confidence ?? 0) * 100).toFixed(1);
      document.getElementById('fitConfidence').textContent = `${response.fit.prediction || ''} · Model confidence ${conf}%`;
      document.getElementById('fitModel').textContent = `Model: ${response.fit.model_type || 'ML'}`;
    }

    renderChips('matchedChips', response.matchedSkills || [], 'matched');
    renderChips('missingChips', response.missingSkills || [], 'missing');
    renderFitCourses(response.courses || {});
    document.getElementById('resumePreview').textContent = response.resumePreview || '';
    document.getElementById('jobPreview').textContent = response.jobPreview || '';

    document.getElementById('fitResults').classList.add('visible');
    document.getElementById('fitResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('fitStatus', 'Analysis complete ✓', 'success');
  } catch (err) {
    console.error(err);
    setStatus('fitStatus', err.message || 'Could not reach the backend. Make sure Flask server is running on port 8000.', 'error');
  } finally {
    setLoading('analyzeBtn', false);
  }
}
document.getElementById('analyzeBtn')?.addEventListener('click', analyze);

// ══════════════════════════════════════════════════════════════
//   TAB 2: CAREER RECOMMENDATION
// ══════════════════════════════════════════════════════════════

async function getCareerRecommendations() {
  const interests = [...document.querySelectorAll('#interestGrid input:checked')].map(i => i.value);
  const skills = document.getElementById('careerSkills')?.value.trim() || '';
  const exp = document.getElementById('careerExp')?.value || 'fresher';

  if (!interests.length) { setStatus('careerStatus', 'Please select at least one interest area.', 'error'); return; }

  setLoading('careerBtn', true, 'Generating…');
  setStatus('careerStatus', 'Mapping your career paths…');
  document.getElementById('careerResults').classList.remove('visible');

  try {
    const data = await fetchAPI('/api/career-recommend/', { interests, skills: skills, experience: exp });
    renderCareerCards(data.recommendations || []);
    // Show source badge
    const heading = document.querySelector('#careerResults .section-heading');
    if (heading) {
      const src = data.source === 'ai' ? '<span class="source-badge ai">✦ AI Generated</span>' : '<span class="source-badge static">📦 Curated Data</span>';
      heading.innerHTML = 'Your Personalised Career Paths &nbsp;' + src;
    }
    document.getElementById('careerResults').classList.add('visible');
    document.getElementById('careerResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('careerStatus', `Found ${data.recommendations?.length || 0} career paths for you ✓`, 'success');
  } catch (err) {
    setStatus('careerStatus', err.message, 'error');
  } finally {
    setLoading('careerBtn', false);
  }
}
window.getCareerRecommendations = getCareerRecommendations;

function renderCareerCards(recs) {
  const container = document.getElementById('careerCards');
  container.innerHTML = '';
  recs.forEach((rec, i) => {
    const card = document.createElement('div');
    card.className = 'career-card';
    card.style.animationDelay = (i * 0.08) + 's';

    const skillTags = (rec.skills || []).map(s => `<span class="career-skill-tag">${s}</span>`).join('');
    const roadmapSteps = (rec.roadmap || []).map(s => `<div class="roadmap-step">${s}</div>`).join('');
    const resourceLinks = (rec.resources || []).map(r =>
      `<a class="resource-link${r.free ? ' free' : ''}" href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title}</a>`
    ).join('');
    const insight = rec.market_insight ? `<div class="career-market-insight">💡 ${rec.market_insight}</div>` : '';

    card.innerHTML = `
      <div class="career-card-header">
        <span class="career-emoji">${rec.emoji || '🚀'}</span>
        <div>
          <div class="career-card-title">${rec.title}</div>
          <div class="career-salary">${rec.salary}</div>
        </div>
      </div>
      <div class="career-match-bar">
        <div class="bar-track"><div class="bar-fill" style="width:0%" data-pct="${rec.match}"></div></div>
        <span class="bar-pct">${rec.match}%</span>
      </div>
      <div class="career-desc">${rec.description}</div>
      <div class="career-skills-row">${skillTags}</div>
      <div class="career-roadmap">${roadmapSteps}</div>
      <div class="career-resources">${resourceLinks}</div>
      ${insight}
    `;
    container.appendChild(card);

    // Animate bar fill
    setTimeout(() => {
      const fill = card.querySelector('.bar-fill');
      if (fill) fill.style.width = fill.dataset.pct + '%';
    }, 100 + i * 80);
  });
}

// ══════════════════════════════════════════════════════════════
//   TAB 3: SKILL QUIZ
// ══════════════════════════════════════════════════════════════

async function startQuiz() {
  const skills = [...document.querySelectorAll('#quizSkillGrid input:checked')].map(i => i.value);
  const count = parseInt(document.getElementById('quizCount').value);

  if (!skills.length) { setStatus('quizStatus', 'Please select at least one skill.', 'error'); return; }

  setLoading('quizBtn', true, 'Generating…');
  setStatus('quizStatus', 'Generating your personalized quiz…');
  document.getElementById('quizSection').classList.remove('visible');
  document.getElementById('quizResults').innerHTML = '';
  _quizAnswers = {};

  try {
    const data = await fetchAPI('/api/generate-quiz/', { skills, count });
    _quiz = data.quiz || [];
    if (!_quiz.length) throw new Error('No quiz questions generated for selected skills.');
    renderQuiz(_quiz);
    document.getElementById('quizSection').classList.add('visible');
    document.getElementById('quizSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('quizStatus', `${_quiz.length} questions ready. Good luck! 🎯`, 'success');
  } catch (err) {
    setStatus('quizStatus', err.message, 'error');
  } finally {
    setLoading('quizBtn', false);
  }
}
window.startQuiz = startQuiz;

function renderQuiz(questions) {
  const container = document.getElementById('quizContainer');
  const submitArea = document.getElementById('quizSubmitArea');
  container.innerHTML = '';
  _quizAnswers = {};

  questions.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'quiz-question-card';
    card.style.animationDelay = (qi * 0.06) + 's';
    card.innerHTML = `
      <div class="quiz-q-num">Question ${qi + 1} of ${questions.length} · <span style="color:var(--c-violet);text-transform:capitalize">${q.skill}</span></div>
      <div class="quiz-q-text">${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <div class="quiz-option" id="qopt-${qi}-${oi}">
            <input type="radio" name="q${qi}" id="qr-${qi}-${oi}" value="${oi}" onchange="recordAnswer(${qi}, ${oi})"/>
            <label for="qr-${qi}-${oi}">${opt}</label>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });

  submitArea.style.display = 'flex';
}

function recordAnswer(qi, oi) {
  _quizAnswers[qi] = oi;
}
window.recordAnswer = recordAnswer;

function submitQuiz() {
  let correct = 0;
  _quiz.forEach((q, qi) => {
    const chosen = _quizAnswers[qi];
    q.options.forEach((_, oi) => {
      const optEl = document.getElementById(`qopt-${qi}-${oi}`);
      if (optEl) {
        optEl.classList.remove('correct', 'wrong');
        if (oi === q.answer) optEl.classList.add('correct');
        else if (oi === chosen && chosen !== q.answer) optEl.classList.add('wrong');
      }
      const radio = document.getElementById(`qr-${qi}-${oi}`);
      if (radio) radio.disabled = true;
    });
    if (chosen === q.answer) correct++;
    // Show explanation
    if (q.explanation) {
      const card = document.querySelector(`.quiz-question-card:nth-child(${qi + 1})`);
      if (card && !card.querySelector('.quiz-explanation')) {
        const exp = document.createElement('div');
        exp.className = 'quiz-explanation';
        exp.innerHTML = `<strong>Explanation:</strong> ${q.explanation}`;
        card.appendChild(exp);
      }
    }
  });

  const total = _quiz.length;
  const pct = Math.round((correct / total) * 100);
  let grade = pct >= 80 ? '🏆 Expert' : pct >= 60 ? '⭐ Proficient' : pct >= 40 ? '📖 Learner' : '🌱 Beginner';
  let gradeColor = pct >= 80 ? 'var(--c-green)' : pct >= 60 ? 'var(--c-cyan)' : pct >= 40 ? 'var(--c-amber)' : 'var(--c-red)';

  document.getElementById('quizResults').innerHTML = `
    <div style="background:rgba(13,17,32,0.97);border:1px solid var(--c-border-hi);border-radius:var(--radius-xl);padding:32px;text-align:center;animation:fadeUp 0.4s ease both">
      <div class="quiz-score-big" style="color:${gradeColor}">${pct}%</div>
      <div class="quiz-score-grade">${grade} · ${correct} / ${total} correct</div>
      <div class="quiz-score-breakdown" style="margin-top:14px">
        ${pct < 60 ? '📚 Keep practising! Head to the <strong>Learning Hub</strong> for curated resources.' : pct >= 80 ? '🎉 Outstanding! You have a strong grasp of these topics.' : '⚡ Good progress! A bit more practice and you\'ll nail it.'}
      </div>
      <button class="primary-btn" style="margin-top:20px" onclick="startQuiz()"><span class="btn-icon">🔄</span><span class="btn-text">Retake Quiz</span><span class="btn-glow"></span></button>
    </div>
  `;
  document.getElementById('quizSubmitArea').style.display = 'none';
  document.getElementById('quizResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.submitQuiz = submitQuiz;

// ══════════════════════════════════════════════════════════════
//   TAB 4: LEARNING HUB
// ══════════════════════════════════════════════════════════════

async function getLearningResources() {
  const interests = [...document.querySelectorAll('#tab-learning .interest-grid input:checked')].map(i => i.value);
  const resumeText = document.getElementById('learningResumeText')?.value.trim() || '';
  const freeOnly = document.getElementById('freeOnly')?.checked || false;

  if (!interests.length && !resumeText) { setStatus('learningStatus', 'Please select at least one topic or paste your resume.', 'error'); return; }

  setStatus('learningStatus', 'Curating your personalised learning path…');
  document.getElementById('learningResults').classList.remove('visible');

  try {
    const data = await fetchAPI('/api/learning-resources/', { interests, resumeText, freeOnly });
    renderLearningResources(data.resources || {});
    document.getElementById('learningResults').classList.add('visible');
    document.getElementById('learningResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const count = Object.values(data.resources || {}).reduce((a, b) => a + b.length, 0);
    setStatus('learningStatus', `${count} resources curated just for you ✓`, 'success');
  } catch (err) {
    setStatus('learningStatus', err.message, 'error');
  }
}
window.getLearningResources = getLearningResources;

function renderLearningResources(resources) {
  const container = document.getElementById('learningCards');
  container.innerHTML = '';
  const skills = Object.keys(resources);

  skills.forEach((skill, si) => {
    const items = resources[skill];
    if (!items?.length) return;

    const section = document.createElement('div');
    section.className = 'learning-skill-section';
    section.style.animationDelay = (si * 0.07) + 's';
    section.innerHTML = `
      <div class="learning-skill-header">
        <span class="learning-skill-name">${skill}</span>
        <span class="learning-skill-count">${items.length} resource${items.length > 1 ? 's' : ''}</span>
      </div>
      <div class="learning-resources-row" id="lr-${si}"></div>
    `;
    container.appendChild(section);

    const row = document.getElementById('lr-' + si);
    items.forEach((r, ri) => {
      const card = document.createElement('div'); card.className = 'learning-card';
      card.style.animationDelay = (si * 0.07 + ri * 0.05) + 's';
      card.innerHTML = `
        <div class="learning-card-title">${r.title}</div>
        <div class="learning-card-meta">
          <span class="lc-platform">${r.platform}</span>
          <span class="lc-rating">⭐ ${r.rating}</span>
          <span class="lc-duration">⏱ ${r.duration}</span>
          <span class="${r.free ? 'lc-free' : 'lc-paid'}">${r.free ? 'FREE' : 'PAID'}</span>
        </div>
        <a class="lc-link" href="${r.url}" target="_blank" rel="noopener noreferrer">Start Learning →</a>
      `;
      row.appendChild(card);
    });
  });
}

// ══════════════════════════════════════════════════════════════
//   TAB 5: RESUME BUILDER
// ══════════════════════════════════════════════════════════════

let _expCount = 0;
let _eduCount = 0;
let _projCount = 0;

function addExp() {
  const id = _expCount++;
  const div = document.createElement('div'); div.className = 'dynamic-entry'; div.id = 'exp-' + id;
  div.innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Job Title</label><input type="text" class="form-input" id="exp-title-${id}" placeholder="" /></div>
      <div class="form-group"><label class="form-label">Company</label><input type="text" class="form-input" id="exp-company-${id}" placeholder="" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Duration</label><input type="text" class="form-input" id="exp-duration-${id}" placeholder="" /></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="text-input" id="exp-desc-${id}" rows="2" placeholder=""></textarea></div>
    <button class="remove-btn" onclick="removeEntry('exp-${id}')">✕ Remove</button>
  `;
  document.getElementById('expList').appendChild(div);
}
window.addExp = addExp;

function addEdu() {
  const id = _eduCount++;
  const div = document.createElement('div'); div.className = 'dynamic-entry'; div.id = 'edu-' + id;
  div.innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Degree / Certificate</label><input type="text" class="form-input" id="edu-degree-${id}" placeholder="" /></div>
      <div class="form-group"><label class="form-label">Institution</label><input type="text" class="form-input" id="edu-inst-${id}" placeholder="" /></div>
    </div>
    <div class="form-group"><label class="form-label">Year</label><input type="text" class="form-input" id="edu-year-${id}" placeholder="" /></div>
    <button class="remove-btn" onclick="removeEntry('edu-${id}')">✕ Remove</button>
  `;
  document.getElementById('eduList').appendChild(div);
}
window.addEdu = addEdu;

function addProject() {
  const id = _projCount++;
  const div = document.createElement('div'); div.className = 'dynamic-entry'; div.id = 'proj-' + id;
  div.innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Project Name</label><input type="text" class="form-input" id="proj-name-${id}" placeholder="" /></div>
      <div class="form-group"><label class="form-label">GitHub / Demo URL</label><input type="text" class="form-input" id="proj-url-${id}" placeholder="" /></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="text-input" id="proj-desc-${id}" rows="2" placeholder=""></textarea></div>
    <button class="remove-btn" onclick="removeEntry('proj-${id}')">✕ Remove</button>
  `;
  document.getElementById('projList').appendChild(div);
}
window.addProject = addProject;

function removeEntry(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
window.removeEntry = removeEntry;

async function buildResume() {
  const name = document.getElementById('rName')?.value.trim() || '';
  const email = document.getElementById('rEmail')?.value.trim() || '';
  const phone = document.getElementById('rPhone')?.value.trim() || '';
  const location = document.getElementById('rLocation')?.value.trim() || '';
  const linkedin = document.getElementById('rLinkedin')?.value.trim() || '';
  const github = document.getElementById('rGithub')?.value.trim() || '';
  const summary = document.getElementById('rSummary')?.value.trim() || '';
  const skillsRaw = document.getElementById('rSkills')?.value.trim() || '';
  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!name || !email) { setStatus('resumeStatus', 'Please fill in at least your name and email.', 'error'); return; }

  // Collect experience entries
  const experience = [];
  document.querySelectorAll('[id^="exp-"][id$="0"],[id^="exp-"][id$="1"],[id^="exp-"][id$="2"],[id^="exp-"][id$="3"],[id^="exp-"][id$="4"]').forEach(() => { });
  for (let i = 0; i < _expCount; i++) {
    if (!document.getElementById('exp-' + i)) continue;
    experience.push({
      title: document.getElementById('exp-title-' + i)?.value.trim(),
      company: document.getElementById('exp-company-' + i)?.value.trim(),
      duration: document.getElementById('exp-duration-' + i)?.value.trim(),
      description: document.getElementById('exp-desc-' + i)?.value.trim(),
    });
  }

  const education = [];
  for (let i = 0; i < _eduCount; i++) {
    if (!document.getElementById('edu-' + i)) continue;
    education.push({
      degree: document.getElementById('edu-degree-' + i)?.value.trim(),
      institution: document.getElementById('edu-inst-' + i)?.value.trim(),
      year: document.getElementById('edu-year-' + i)?.value.trim(),
    });
  }

  const projects = [];
  for (let i = 0; i < _projCount; i++) {
    if (!document.getElementById('proj-' + i)) continue;
    projects.push({
      name: document.getElementById('proj-name-' + i)?.value.trim(),
      url: document.getElementById('proj-url-' + i)?.value.trim(),
      description: document.getElementById('proj-desc-' + i)?.value.trim(),
    });
  }

  setStatus('resumeStatus', 'Generating your resume…');
  try {
    const data = await fetchAPI('/api/resume-export/', {
      resume: { name, email, phone, location, linkedin, github, summary, skills, experience, education, projects }
    });

    // Store raw text for copying
    window._lastResumeText = data.text || '';

    // Generate Beautiful HTML Template for Preview
    const contactRow = [email, phone, location, linkedin, github].filter(Boolean).join(' | ');
    let html = `<div class="r-template" id="printArea">
      <div class="r-name">${escapeHTML(name)}</div>
      <div class="r-contact">${escapeHTML(contactRow)}</div>
    `;

    if (summary) {
      html += `<div class="r-sec-title">Summary</div><div class="r-item-desc">${escapeHTML(summary)}</div>`;
    }

    if (skills.length) {
      html += `<div class="r-sec-title">Skills</div><div class="r-skills">${escapeHTML(skills.join(', '))}</div>`;
    }

    if (experience.length) {
      html += `<div class="r-sec-title">Experience</div>`;
      experience.forEach(e => {
        if (!e.title && !e.company) return;
        html += `<div class="r-item">
          <div class="r-item-head">
            <span class="r-item-title">${escapeHTML(e.title || '')} @ ${escapeHTML(e.company || '')}</span>
            <span class="r-item-meta">${escapeHTML(e.duration || '')}</span>
          </div>
          <div class="r-item-desc">${escapeHTML(e.description || '').replace(/\\n/g, '<br>')}</div>
        </div>`;
      });
    }

    if (education.length) {
      html += `<div class="r-sec-title">Education</div>`;
      education.forEach(e => {
        if (!e.degree && !e.institution) return;
        html += `<div class="r-item">
          <div class="r-item-head">
            <span class="r-item-title">${escapeHTML(e.degree || '')}</span>
            <span class="r-item-meta">${escapeHTML(e.institution || '')} | ${escapeHTML(e.year || '')}</span>
          </div>
        </div>`;
      });
    }

    if (projects.length) {
      html += `<div class="r-sec-title">Projects</div>`;
      projects.forEach(p => {
        if (!p.name) return;
        html += `<div class="r-item" style="margin-bottom:8px">
          <strong>${escapeHTML(p.name)}</strong>: ${escapeHTML(p.description || '')} 
          ${p.url ? `<br><a href="${escapeHTML(p.url)}" target="_blank" style="font-size:0.8rem;color:#0d6efd">${escapeHTML(p.url)}</a>` : ''}
        </div>`;
      });
    }
    html += `</div>`;
    document.getElementById('resumeOutput').innerHTML = html;

    setStatus('resumeStatus', 'Resume generated! You can now copy or download it. ✓', 'success');
  } catch (err) {
    setStatus('resumeStatus', err.message, 'error');
  }
}
window.buildResume = buildResume;

// Helper to prevent XSS during injection
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

function copyResume() {
  const text = window._lastResumeText || document.getElementById('resumeOutput')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyResumeBtn');
    if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '📋 Copy text'; }, 2000); }
  }).catch(() => {
    document.execCommand('copy');
  });
}
window.copyResume = copyResume;

function downloadResumeHTML() {
  const content = document.getElementById('printArea');
  if (!content) {
    alert("Please build your resume first!");
    return;
  }

  // Wrap in complete HTML boiler plate
  const blobData = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #fff; color: #333; margin:0; padding:40px; }
    .r-name { font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; margin-bottom: 5px; color: #1a1b1e; }
    .r-contact { font-size: 0.9rem; color: #52555b; margin-bottom: 24px; border-bottom: 2px solid #e8eaed; padding-bottom: 14px; }
    .r-sec-title { font-size: 1.15rem; font-weight: 800; color: #1a1b1e; border-bottom: 1px solid #e8eaed; padding-bottom: 4px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .r-item { margin-bottom: 16px; }
    .r-item-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
    .r-item-title { font-weight: 700; font-size: 1rem; }
    .r-item-meta { font-style: italic; color: #52555b; font-size: 0.9rem; }
    .r-item-desc { font-size: 0.9rem; line-height: 1.6; color: #3a3d42; }
    .r-skills { font-size: 0.9rem; line-height: 1.6; }
    a { color: #0d6efd; text-decoration: none; }
  </style>
</head>
<body>
  ${content.innerHTML}
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([blobData], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${document.getElementById('rName')?.value.trim() || 'My'}_Resume.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
window.downloadResumeHTML = downloadResumeHTML;

// ══════════════════════════════════════════════════════════════
//   TAB 6: INTERNSHIP FINDER
// ══════════════════════════════════════════════════════════════

// Update stipend bar visual
function updateStipendBar() {
  const min = parseFloat(document.getElementById('internMinStipend')?.value) || 0;
  const max = parseFloat(document.getElementById('internMaxStipend')?.value) || 100000;
  const pct = Math.min(100, (max / 100000) * 100);
  const fill = document.getElementById('stipendFill');
  if (fill) fill.style.width = pct + '%';
}
document.getElementById('internMinStipend')?.addEventListener('input', updateStipendBar);
document.getElementById('internMaxStipend')?.addEventListener('input', updateStipendBar);

async function findInternships() {
  const location = document.getElementById('internLocation')?.value || 'any';
  const domain = document.getElementById('internDomain')?.value || '';
  const minStipend = parseFloat(document.getElementById('internMinStipend')?.value) || 0;
  const maxStipend = parseFloat(document.getElementById('internMaxStipend')?.value) || 999999;
  const skillsRaw = document.getElementById('internSkills')?.value.trim() || '';
  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  setStatus('internStatus', 'Searching for internships…');
  document.getElementById('internResults').classList.remove('visible');

  try {
    const data = await fetchAPI('/api/internships/', { location, domain, minStipend, maxStipend, skills });
    renderInternships(data.internships || [], data.total || 0);
    document.getElementById('internResults').classList.add('visible');
    document.getElementById('internResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('internStatus', `Found ${data.total} matching opportunities ✓`, 'success');
  } catch (err) {
    setStatus('internStatus', err.message, 'error');
  }
}
window.findInternships = findInternships;

function renderInternships(internships, total) {
  document.getElementById('internHeading').textContent = `${total} Matching Opportunities`;
  const container = document.getElementById('internCards');
  container.innerHTML = '';

  if (!internships.length) {
    container.innerHTML = '<p style="color:var(--c-muted);font-style:italic">No internships match your filters. Try adjusting location or stipend range.</p>';
    return;
  }

  internships.forEach((intern, i) => {
    const score = intern.matchScore || 0;
    const badgeClass = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    const skillTags = (intern.skills || []).map(s => `<span class="intern-skill">${s}</span>`).join('');

    const card = document.createElement('div'); card.className = 'intern-card';
    card.style.animationDelay = (i * 0.06) + 's';
    const insightHtml = intern.market_insight ? `<div class="intern-market-insight">💡 ${intern.market_insight}</div>` : '';
    card.innerHTML = `
      <div class="intern-header">
        <div>
          <div class="intern-title">${intern.title}</div>
          <div class="intern-company">${intern.company}</div>
        </div>
        <div class="intern-match-badge ${badgeClass}">${score}% match</div>
      </div>
      <div class="intern-stipend">${intern.salary}</div>
      <div class="intern-details">
        <div class="intern-detail"><span class="intern-detail-icon">📍</span>${intern.location}</div>
        <div class="intern-detail"><span class="intern-detail-icon">⏳</span>${intern.duration}</div>
        <div class="intern-detail"><span class="intern-detail-icon">🏷️</span>${intern.type}</div>
      </div>
      <div class="intern-skills-row">${skillTags}</div>
      ${insightHtml}
      <a class="intern-apply-btn" href="${intern.apply}" target="_blank" rel="noopener noreferrer">Apply Now →</a>
    `;
    container.appendChild(card);
  });
}

// ── Init ──────────────────────────────────────────────────────
updateStipendBar();
addExp();   // start with one experience entry
addEdu();   // start with one education entry
