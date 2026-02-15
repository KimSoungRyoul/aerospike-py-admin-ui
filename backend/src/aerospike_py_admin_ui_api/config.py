from __future__ import annotations

import os

CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))

DATABASE_PATH: str = os.getenv("DATABASE_PATH", "data/connections.db")

AEROSPIKE_HOST: str = os.getenv("AEROSPIKE_HOST", "localhost")
AEROSPIKE_PORT: int = int(os.getenv("AEROSPIKE_PORT", "3000"))
