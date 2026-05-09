"""
FastAPI Backend — Nested Tags Tree
Database: SQLite (file: trees.db — auto-created, no setup needed)
Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
from datetime import datetime

app = FastAPI(title="Nested Tags Tree API")

# ── Allow React frontend to call this API ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "trees.db"


# ── Database setup ─────────────────────────────────────────────────────────────

def get_db():
    """Open a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


def init_db():
    """Create the trees table if it doesn't exist yet."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trees (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            data       TEXT    NOT NULL,
            created_at TEXT    NOT NULL,
            updated_at TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()


# Run on startup
init_db()


# ── Request / Response models ──────────────────────────────────────────────────

class TreeCreate(BaseModel):
    data: str  # full tree as a JSON string


class TreeUpdate(BaseModel):
    data: str  # updated tree as a JSON string


class TreeRecord(BaseModel):
    id: int
    data: str
    created_at: str
    updated_at: str


# ── API Endpoints ──────────────────────────────────────────────────────────────

@app.get("/trees", response_model=list[TreeRecord])
def get_all_trees():
    """
    GET /trees
    Returns all saved tree hierarchies (newest first).
    Called when the frontend page loads.
    """
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM trees ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/trees/{tree_id}", response_model=TreeRecord)
def get_tree(tree_id: int):
    """
    GET /trees/{id}
    Returns a single tree by its ID.
    """
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM trees WHERE id = ?", (tree_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Tree not found")
    return dict(row)


@app.post("/trees", response_model=TreeRecord, status_code=201)
def create_tree(body: TreeCreate):
    """
    POST /trees
    Saves a new tree hierarchy to the database.
    Called when Export is clicked for the first time.
    """
    # Validate that it's proper JSON
    try:
        json.loads(body.data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="data is not valid JSON")

    now = datetime.utcnow().isoformat()
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO trees (data, created_at, updated_at) VALUES (?, ?, ?)",
        (body.data, now, now),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM trees WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    conn.close()
    return dict(row)


@app.put("/trees/{tree_id}", response_model=TreeRecord)
def update_tree(tree_id: int, body: TreeUpdate):
    """
    PUT /trees/{id}
    Updates an existing tree hierarchy.
    Called when Export is clicked after a tree was already saved.
    """
    try:
        json.loads(body.data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="data is not valid JSON")

    now = datetime.utcnow().isoformat()
    conn = get_db()
    result = conn.execute(
        "UPDATE trees SET data = ?, updated_at = ? WHERE id = ?",
        (body.data, now, tree_id),
    )
    conn.commit()
    if result.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tree not found")
    row = conn.execute(
        "SELECT * FROM trees WHERE id = ?", (tree_id,)
    ).fetchone()
    conn.close()
    return dict(row)


@app.delete("/trees/{tree_id}", status_code=204)
def delete_tree(tree_id: int):
    """
    DELETE /trees/{id}
    Deletes a tree from the database.
    """
    conn = get_db()
    result = conn.execute(
        "DELETE FROM trees WHERE id = ?", (tree_id,)
    )
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tree not found")