from __future__ import annotations

import sqlite3
import time
import os
from typing import Any, Dict, List, Mapping, Optional, Sequence, Union

from fastapi import FastAPI
from pydantic import BaseModel


# ========================= IMPORTANT =========================
# Set your SQLite database file path here. For example:
# DATABASE_PATH = r"C:\\Users\\HOME\\Desktop\\ProjectAP\\Database\\app_database.db"
# Or if running from Backend directory with a sibling Database folder:
# DATABASE_PATH = r"..\\Database\\app_database.db"
# =============================================================
DATABASE_PATH: str = "C:/Users/HOME/Desktop/ProjectAP/ProjectAP/Database/app_database.db"


def get_sqlite_connection() -> sqlite3.Connection:
    if not DATABASE_PATH:
        raise RuntimeError("DATABASE_PATH is empty. Please set it to your SQLite file path.")
    if not os.path.exists(DATABASE_PATH):
        raise RuntimeError(f"Database file not found at: {DATABASE_PATH}")
    # Create a new connection per request for thread safety
    conn = sqlite3.connect(DATABASE_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def is_select_query(sql: str) -> bool:
    stripped = sql.lstrip().lower()
    return stripped.startswith("select") or stripped.startswith("pragma")


class QueryRequest(BaseModel):
    query: str
    # You can pass positional params as a list or named params as an object
    params: Optional[Union[Sequence[Any], Mapping[str, Any]]] = None


class QueryResponse(BaseModel):
    ok: bool
    rows: Optional[List[Dict[str, Any]]] = None
    rowcount: Optional[int] = None
    last_row_id: Optional[int] = None
    duration_ms: float
    error: Optional[str] = None


app = FastAPI(title="SQLite Query API", version="1.0.0")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
def execute_query(payload: QueryRequest) -> QueryResponse:
    start_time = time.monotonic()
    try:
        with get_sqlite_connection() as conn:
            cursor = conn.cursor()

            if payload.params is None:
                cursor.execute(payload.query)
            else:
                cursor.execute(payload.query, payload.params)  # supports list/tuple or dict

            # If it's a SELECT/PRAGMA, fetch rows; otherwise commit and return counts
            if cursor.description is not None and is_select_query(payload.query):
                columns = [col[0] for col in cursor.description]
                fetched_rows = cursor.fetchall()
                rows_as_dicts: List[Dict[str, Any]] = [
                    {col: row[idx] for idx, col in enumerate(columns)} for row in fetched_rows
                ]
                duration_ms = (time.monotonic() - start_time) * 1000.0
                return QueryResponse(
                    ok=True,
                    rows=rows_as_dicts,
                    rowcount=len(rows_as_dicts),
                    last_row_id=None,
                    duration_ms=duration_ms,
                )
            else:
                conn.commit()
                duration_ms = (time.monotonic() - start_time) * 1000.0
                return QueryResponse(
                    ok=True,
                    rows=None,
                    rowcount=cursor.rowcount,
                    last_row_id=cursor.lastrowid,
                    duration_ms=duration_ms,
                )
    except Exception as exc:  # noqa: BLE001 - surface errors to client explicitly
        duration_ms = (time.monotonic() - start_time) * 1000.0
        return QueryResponse(
            ok=False,
            error=str(exc),
            duration_ms=duration_ms,
        )


if __name__ == "__main__":
    import uvicorn  # Imported here to avoid mandatory dependency at import time

    # Run: python APIDB.py
    uvicorn.run("APIDB:app", host="0.0.0.0", port=9010, reload=True)




