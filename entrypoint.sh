#!/bin/bash
set -e

# Start backend (FastAPI)
cd /app/backend
uv run uvicorn aerospike_py_admin_ui_api.main:app \
    --host 0.0.0.0 --port 8000 &

# Start frontend (Next.js)
cd /app/frontend
BACKEND_URL=http://localhost:8000 HOSTNAME=0.0.0.0 PORT=3000 node server.js &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
