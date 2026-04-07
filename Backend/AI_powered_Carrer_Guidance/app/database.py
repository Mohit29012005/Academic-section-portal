"""
AI powered Career Guidance system — SQLite Database Layer
Tracks user sessions and all feature interactions.

DB File: evolvex.db (created in project root on first run)

Tables:
  sessions          — one row per browser session
  fit_analyses      — each resume ↔ job analysis run
  career_searches   — career recommendation searches
  quiz_attempts     — individual quiz sessions with scores
  learning_requests — learning resource lookups
  internship_searches — internship finder queries
  resume_builds     — resume builder submissions
"""

import sqlite3
import json
import os
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

# DB stored in project root next to server.py
DB_PATH = Path(__file__).resolve().parent.parent / "evolvex.db"


# ══════════════════════════════════════════════════════════════
#   CONNECTION
# ══════════════════════════════════════════════════════════════

def get_connection() -> sqlite3.Connection:
    """Return an auto-commit-ready SQLite connection with row_factory."""
    conn = sqlite3.connect(str(DB_PATH), detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")   # better concurrent reads
    return conn


# ══════════════════════════════════════════════════════════════
#   SCHEMA INITIALISATION
# ══════════════════════════════════════════════════════════════

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,          -- UUID from frontend localStorage
    ip_address    TEXT,
    user_agent    TEXT,
    first_seen    TEXT NOT NULL DEFAULT (datetime('now')),
    last_active   TEXT NOT NULL DEFAULT (datetime('now')),
    total_actions INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fit_analyses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    ip_address      TEXT,
    match_score     REAL,
    fit_prediction  TEXT,
    fit_confidence  REAL,
    matched_skills  TEXT,                    -- JSON list
    missing_skills  TEXT,                    -- JSON list
    resume_preview  TEXT,
    job_preview     TEXT,
    model_type      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS career_searches (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    ip_address      TEXT,
    interests       TEXT,                    -- JSON list
    current_skills  TEXT,
    experience      TEXT,
    result_count    INTEGER,
    ai_generated    INTEGER DEFAULT 0,       -- 1 = LLM, 0 = static
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    ip_address      TEXT,
    skills_tested   TEXT,                    -- JSON list
    total_questions INTEGER,
    correct_answers INTEGER,
    score_percent   REAL,
    grade           TEXT,
    ai_generated    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS learning_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    ip_address      TEXT,
    topics          TEXT,                    -- JSON list
    free_only       INTEGER DEFAULT 0,
    resource_count  INTEGER,
    ai_generated    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS internship_searches (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    ip_address      TEXT,
    location        TEXT,
    domain          TEXT,
    min_stipend     INTEGER,
    max_stipend     INTEGER,
    skills          TEXT,                    -- JSON list
    result_count    INTEGER,
    ai_generated    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS resume_builds (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    ip_address      TEXT,
    full_name       TEXT,
    email           TEXT,
    location        TEXT,
    skills          TEXT,                    -- JSON list
    exp_count       INTEGER DEFAULT 0,
    edu_count       INTEGER DEFAULT 0,
    project_count   INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_fit_session      ON fit_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_career_session   ON career_searches(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_session     ON quiz_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_session ON learning_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_intern_session   ON internship_searches(session_id);
CREATE INDEX IF NOT EXISTS idx_resume_session   ON resume_builds(session_id);
"""


def init_db():
    """Create all tables if they don't exist."""
    try:
        with get_connection() as conn:
            conn.executescript(SCHEMA)
        logger.info(f"Database initialised at: {DB_PATH}")
    except Exception as e:
        logger.error(f"Database init failed: {e}")
        raise


# ══════════════════════════════════════════════════════════════
#   SESSION MANAGEMENT
# ══════════════════════════════════════════════════════════════

def upsert_session(session_id: str, ip: str = "", user_agent: str = ""):
    """Create or update a session entry."""
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO sessions (id, ip_address, user_agent)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    last_active   = datetime('now'),
                    total_actions = total_actions + 1,
                    ip_address    = excluded.ip_address
            """, (session_id, ip, user_agent))
    except Exception as e:
        logger.warning(f"upsert_session failed: {e}")


def get_session(session_id: str) -> dict | None:
    """Fetch a session by ID."""
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ?", (session_id,)
            ).fetchone()
            return dict(row) if row else None
    except Exception as e:
        logger.warning(f"get_session failed: {e}")
        return None


# ══════════════════════════════════════════════════════════════
#   FEATURE TRACKERS
# ══════════════════════════════════════════════════════════════

def log_fit_analysis(session_id: str, ip: str, match_score: float,
                     fit_prediction: str, fit_confidence: float,
                     matched_skills: list, missing_skills: list,
                     resume_preview: str, job_preview: str, model_type: str):
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO fit_analyses
                  (session_id, ip_address, match_score, fit_prediction,
                   fit_confidence, matched_skills, missing_skills,
                   resume_preview, job_preview, model_type)
                VALUES (?,?,?,?,?,?,?,?,?,?)
            """, (
                session_id, ip, match_score, fit_prediction, fit_confidence,
                json.dumps(matched_skills), json.dumps(missing_skills),
                resume_preview[:500] if resume_preview else "",
                job_preview[:500]    if job_preview    else "",
                model_type,
            ))
        upsert_session(session_id, ip)
    except Exception as e:
        logger.warning(f"log_fit_analysis failed: {e}")


def log_career_search(session_id: str, ip: str, interests: list,
                      skills: str, experience: str, result_count: int, ai_generated: bool):
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO career_searches
                  (session_id, ip_address, interests, current_skills,
                   experience, result_count, ai_generated)
                VALUES (?,?,?,?,?,?,?)
            """, (session_id, ip, json.dumps(interests), skills,
                  experience, result_count, int(ai_generated)))
        upsert_session(session_id, ip)
    except Exception as e:
        logger.warning(f"log_career_search failed: {e}")


def log_quiz_attempt(session_id: str, ip: str, skills: list,
                     total: int, correct: int, score_pct: float,
                     grade: str, ai_generated: bool):
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO quiz_attempts
                  (session_id, ip_address, skills_tested, total_questions,
                   correct_answers, score_percent, grade, ai_generated)
                VALUES (?,?,?,?,?,?,?,?)
            """, (session_id, ip, json.dumps(skills), total,
                  correct, score_pct, grade, int(ai_generated)))
        upsert_session(session_id, ip)
    except Exception as e:
        logger.warning(f"log_quiz_attempt failed: {e}")


def log_learning_request(session_id: str, ip: str, topics: list,
                         free_only: bool, resource_count: int, ai_generated: bool):
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO learning_requests
                  (session_id, ip_address, topics, free_only,
                   resource_count, ai_generated)
                VALUES (?,?,?,?,?,?)
            """, (session_id, ip, json.dumps(topics),
                  int(free_only), resource_count, int(ai_generated)))
        upsert_session(session_id, ip)
    except Exception as e:
        logger.warning(f"log_learning_request failed: {e}")


def log_internship_search(session_id: str, ip: str, location: str,
                          domain: str, min_stipend: int, max_stipend: int,
                          skills: list, result_count: int, ai_generated: bool):
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO internship_searches
                  (session_id, ip_address, location, domain,
                   min_stipend, max_stipend, skills, result_count, ai_generated)
                VALUES (?,?,?,?,?,?,?,?,?)
            """, (session_id, ip, location, domain, min_stipend,
                  max_stipend, json.dumps(skills), result_count, int(ai_generated)))
        upsert_session(session_id, ip)
    except Exception as e:
        logger.warning(f"log_internship_search failed: {e}")


def log_resume_build(session_id: str, ip: str, name: str, email: str,
                     location: str, skills: list, exp_count: int,
                     edu_count: int, project_count: int):
    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO resume_builds
                  (session_id, ip_address, full_name, email, location,
                   skills, exp_count, edu_count, project_count)
                VALUES (?,?,?,?,?,?,?,?,?)
            """, (session_id, ip, name, email, location,
                  json.dumps(skills), exp_count, edu_count, project_count))
        upsert_session(session_id, ip)
    except Exception as e:
        logger.warning(f"log_resume_build failed: {e}")


# ══════════════════════════════════════════════════════════════
#   HISTORY / ANALYTICS QUERIES
# ══════════════════════════════════════════════════════════════

def get_session_history(session_id: str) -> dict:
    """Return full activity history for a session."""
    try:
        with get_connection() as conn:
            session = conn.execute(
                "SELECT * FROM sessions WHERE id = ?", (session_id,)
            ).fetchone()
            if not session:
                return {}

            def q(table):
                rows = conn.execute(
                    f"SELECT * FROM {table} WHERE session_id = ? ORDER BY created_at DESC LIMIT 20",
                    (session_id,)
                ).fetchall()
                return [dict(r) for r in rows]

            history = {
                "session":     dict(session),
                "fit_analyses":       q("fit_analyses"),
                "career_searches":    q("career_searches"),
                "quiz_attempts":      q("quiz_attempts"),
                "learning_requests":  q("learning_requests"),
                "internship_searches":q("internship_searches"),
                "resume_builds":      q("resume_builds"),
            }
            # Deserialise JSON fields
            for item in history["fit_analyses"]:
                for k in ("matched_skills", "missing_skills"):
                    if item.get(k):
                        try: item[k] = json.loads(item[k])
                        except: pass
            for item in history["career_searches"]:
                if item.get("interests"):
                    try: item["interests"] = json.loads(item["interests"])
                    except: pass
            for item in history["quiz_attempts"]:
                if item.get("skills_tested"):
                    try: item["skills_tested"] = json.loads(item["skills_tested"])
                    except: pass
            for item in history["learning_requests"]:
                if item.get("topics"):
                    try: item["topics"] = json.loads(item["topics"])
                    except: pass
            for item in history["internship_searches"]:
                if item.get("skills"):
                    try: item["skills"] = json.loads(item["skills"])
                    except: pass
            for item in history["resume_builds"]:
                if item.get("skills"):
                    try: item["skills"] = json.loads(item["skills"])
                    except: pass
            return history
    except Exception as e:
        logger.warning(f"get_session_history failed: {e}")
        return {}


def get_platform_stats() -> dict:
    """Aggregate stats across all sessions (for admin/insights)."""
    try:
        with get_connection() as conn:
            def scalar(sql):
                row = conn.execute(sql).fetchone()
                return row[0] if row else 0

            return {
                "total_sessions":       scalar("SELECT COUNT(*) FROM sessions"),
                "total_analyses":       scalar("SELECT COUNT(*) FROM fit_analyses"),
                "avg_match_score":      round(scalar("SELECT AVG(match_score) FROM fit_analyses") or 0, 1),
                "total_careers":        scalar("SELECT COUNT(*) FROM career_searches"),
                "total_quizzes":        scalar("SELECT COUNT(*) FROM quiz_attempts"),
                "avg_quiz_score":       round(scalar("SELECT AVG(score_percent) FROM quiz_attempts") or 0, 1),
                "total_learning":       scalar("SELECT COUNT(*) FROM learning_requests"),
                "total_internships":    scalar("SELECT COUNT(*) FROM internship_searches"),
                "total_resumes_built":  scalar("SELECT COUNT(*) FROM resume_builds"),
                "ai_responses":         scalar("SELECT COUNT(*) FROM career_searches WHERE ai_generated=1") +
                                        scalar("SELECT COUNT(*) FROM quiz_attempts WHERE ai_generated=1") +
                                        scalar("SELECT COUNT(*) FROM learning_requests WHERE ai_generated=1") +
                                        scalar("SELECT COUNT(*) FROM internship_searches WHERE ai_generated=1"),
            }
    except Exception as e:
        logger.warning(f"get_platform_stats failed: {e}")
        return {}
