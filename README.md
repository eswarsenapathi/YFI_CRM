YFI CRM — Full-Stack CRM & Ticketing System
A full-stack Customer Relationship Management (CRM) and ticketing application built to help manage customer support requests, assign tickets, and track ticket progress.
Live Demo: https://yfi-crm-frontend.vercel.app
Repository: https://github.com/eswarsenapathi/YFI_CRM

Project Overview
YFI CRM provides role-based access for Admins, Managers, Engineers, and Customers. Users can work with support tickets according to their role and permissions.
Main Features
- JWT-based user authentication
- Role-based access for Admin, Manager, Engineer, and Customer
- Create and manage support tickets
- Ticket assignment and tracking
- Ticket priority and status management
- Dashboard summary
- React frontend connected to Django REST APIs
Technology Stack
Area	Technologies
Frontend	React, JavaScript, Bootstrap
Backend	Python, Django, Django REST Framework
Authentication	JSON Web Token (JWT)
Database	SQLite (development)
Tools	Git, GitHub, Visual Studio Code


User Roles
- Admin: Manages users and oversees the system.
- Manager: Manages team work and ticket assignment.
- Engineer: Works on assigned support tickets.
- Customer: Creates and tracks support requests.
Role permissions should be checked against the current implementation.
Project Structure
The project contains a React frontend and a Django backend. The exact folder names may differ in your local repository.
YFI_CRM/
├── frontend/       # React application
└── yfi_backend/   # Django project and API application(s)
Run the Project Locally
Prerequisites
- Python installed
- Node.js and npm installed
- Git installed
1. Clone the repository
git clone https://github.com/eswarsenapathi/YFI_CRM.git
cd YFI_CRM
2. Start the Django backend
Open a terminal in the Django backend folder (for example, yfi_backend):
python -m venv .venv
Activate the virtual environment:

Windows PowerShell
.venv\Scripts\Activate.ps1
Install the backend packages. If the repository contains requirements.txt:
pip install -r requirements.txt
Run database migrations and start Django:
python manage.py migrate
python manage.py runserver
The backend development server normally runs at http://127.0.0.1:8000/.
3. Start the React frontend
Open another terminal in the frontend folder (the folder containing package.json):
npm install
npm run dev
Use the local URL printed by Vite or your configured frontend development server.
Setup note: Confirm the folder names and commands against the repository before publishing this README. If the frontend uses a different start script, use the script listed in its package.json.

API and Authentication
The backend uses Django REST Framework to provide API endpoints. JWT tokens are used for authenticated requests. Protected endpoints require a valid access token in the request's Authorization header.

Example header:
Authorization: Bearer <access_token>
Screenshots
Add screenshots of the login page, dashboard, ticket list, and ticket details here.
![YFI CRM Dashboard](docs/screenshots/dashboard.png)
What I Learned
- Building REST APIs with Django REST Framework
- Working with Django models, serializers, and ORM
- Implementing JWT authentication
- Connecting a React frontend to backend APIs
- Managing role-based access and ticket workflows
- Using Git and GitHub for project version control
Author
Eswara Rao Senapathi
- GitHub: @eswarsenapathi
- Project Repository: YFI_CRM
- Live Demo: YFI CRM
