# YFI CRM - Combined Project Package

This package contains the Django backend and React/Vite frontend in one folder. The updated frontend files provided in the previous UI ZIP have been merged into `yfi_frontend/src`.

## Folders
- `yfi_backend/` — Django REST API
- `yfi_frontend/` — React + Vite UI

## Run the backend (Windows PowerShell)
1. Open a terminal in `yfi_backend`.
2. Create and activate a virtual environment:
   `python -m venv .venv`
   ` .venv\Scripts\Activate.ps1`
3. Install dependencies. If `requirements.txt` exists, run `pip install -r requirements.txt`. If it does not exist, dependencies must be installed based on the imports in the project before running.
4. Run `python manage.py migrate` and then `python manage.py runserver`.

## Run the frontend (Windows PowerShell)
1. Open another terminal in `yfi_frontend`.
2. Run `npm install`.
3. Run `npm run dev`.

## Important
- `node_modules`, Python virtual environments, caches, and compiled Python files are excluded; install dependencies locally.
- This combined package has not been fully run-tested or production-deployed. Check API URLs, CORS, environment variables, and Django production settings before deployment.
- Keep secret keys and credentials out of GitHub. Do not commit the local SQLite database to a public repository.
