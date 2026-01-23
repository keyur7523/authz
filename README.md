# AuthZ Platform

<div align="center">

![AuthZ Platform](https://img.shields.io/badge/AuthZ-Platform-3b82f6?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1?style=flat-square&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**A production-grade authorization and approval workflow system**

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [API](#api-documentation) • [Screenshots](#screenshots)

</div>

---

## Overview

AuthZ Platform is a comprehensive authorization management system that provides:

- **Role-Based Access Control (RBAC)** — Define roles, assign permissions, manage user access
- **Policy-Based Access Control (PBAC)** — Create flexible policies with conditions
- **Approval Workflows** — Request, approve, and audit access changes
- **Complete Audit Trail** — Track every action for compliance

Built as a fullstack application demonstrating enterprise authorization patterns used by companies like Google, Meta, and ByteDance.

---

## Features

### 🔐 Authentication
- Email/password registration and login
- JWT access tokens (15 min) + refresh tokens (7 days)
- Refresh token rotation for security
- OAuth integration (GitHub, Google)

### 🏢 Multi-Tenancy
- Organization-based data isolation
- Member roles: Owner, Admin, Member
- Invite system with expiring tokens

### 👥 Role Management
- Create custom roles per organization
- Assign granular permissions to roles
- Bulk permission management
- View users per role

### 🔑 Permission System
- Resource:action format (e.g., `database:read`)
- Wildcard support (`database:*`)
- Effective permission calculation

### 📋 Policy Engine
- JSON-based policy documents
- Principal matching (users, roles)
- Action and resource patterns
- Attribute-based conditions
- Priority-based evaluation
- Deny-overrides-allow logic

### ✅ Approval Workflow
- Submit access requests with justification
- Approver inbox with pending requests
- Approve/deny with comments
- Auto-grant on approval
- Request cancellation
- Status tracking (pending → approved/denied → expired)

### 📊 Audit Logging
- Immutable event log
- Filter by action, actor, time range
- Full-text search
- CSV/JSON export
- Compliance-ready

### ⌨️ Power User Features
- Command palette (Cmd+K)
- Keyboard navigation (j/k)
- Quick search (/)
- Go-to shortcuts (G+R, G+P, etc.)
- Dark/light theme

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/authz-platform.git
cd authz-platform/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn src.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Auth   │ │  Roles  │ │  Users  │ │Requests │ │  Audit  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                              │                                  │
│                    React Query + Zustand                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │ REST API
┌──────────────────────────────┼──────────────────────────────────┐
│                        Backend (FastAPI)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      API Routes                          │   │
│  │  /auth  /orgs  /roles  /permissions  /policies  /audit  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Services                            │   │
│  │  AuthService  RBACService  PolicyService  WorkflowService│   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   SQLAlchemy Models                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │    PostgreSQL       │
                    │  ┌──────────────┐   │
                    │  │ 12 Tables    │   │
                    │  └──────────────┘   │
                    └─────────────────────┘
```

### Database Schema

```
users ─────────────┬─────────── org_memberships ───────── organizations
                   │                                            │
                   │                                            │
              user_roles ──────────── roles ─────────── role_permissions
                   │                    │                       │
                   │                    │                       │
                   │               policies              permissions
                   │
                   │
            access_requests ────── approval_actions
                   │
                   └────────────── audit_logs
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 |
| **State** | Zustand (client), React Query (server) |
| **Backend** | FastAPI, Python 3.11+, Pydantic 2 |
| **Database** | PostgreSQL 15+, SQLAlchemy 2.0 (async) |
| **Auth** | JWT (PyJWT), bcrypt |
| **Testing** | Pytest, pytest-asyncio |

---

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

### Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orgs` | Create org |
| GET | `/api/orgs` | List my orgs |
| GET | `/api/orgs/{id}` | Get org |
| PUT | `/api/orgs/{id}` | Update org |
| DELETE | `/api/orgs/{id}` | Delete org |
| GET | `/api/orgs/{id}/members` | List members |

### Roles & Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orgs/{id}/roles` | Create role |
| GET | `/api/orgs/{id}/roles` | List roles |
| PUT | `/api/orgs/{id}/roles/{rid}` | Update role |
| DELETE | `/api/orgs/{id}/roles/{rid}` | Delete role |
| POST | `/api/orgs/{id}/permissions` | Create permission |
| GET | `/api/orgs/{id}/permissions` | List permissions |

### Authorization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/authorize` | Check access |
| POST | `/api/authorize/bulk` | Bulk check |

### Access Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orgs/{id}/requests` | Submit request |
| GET | `/api/orgs/{id}/requests` | My requests |
| GET | `/api/orgs/{id}/requests/pending` | Pending (admin) |
| POST | `/api/orgs/{id}/requests/{rid}/approve` | Approve |
| POST | `/api/orgs/{id}/requests/{rid}/deny` | Deny |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orgs/{id}/audit` | Query logs |
| GET | `/api/orgs/{id}/audit/export` | Export CSV/JSON |

Full API documentation available at `/docs` when running the backend.

---

## Screenshots

### Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ AuthZ Platform                    🌙  [Acme Corp ▼]  [KP]      │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│ Dashboard   │  Dashboard                                        │
│ ─────────── │                                                   │
│ Roles       │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ Permissions │  │ Users   │ │ Roles   │ │Policies │ │ Pending ││
│ Users       │  │   15    │ │    5    │ │    8    │ │    3    ││
│ Requests    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│ Audit       │                                                   │
│             │  Recent Activity                                  │
│             │  ─────────────────────────────────────────────── │
│             │  • Jane approved Developer role for John          │
│             │  • Admin role updated                             │
│             │  • New policy created: Engineers DB Access        │
│             │                                                   │
└─────────────┴───────────────────────────────────────────────────┘
```

### Role Management
```
┌─────────────────────────────────────────────────────────────────┐
│ Roles                                        [+ Create Role]    │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search roles...                                              │
├─────────────────────────────────────────────────────────────────┤
│ Name          │ Description              │ Permissions │ Users  │
│───────────────┼──────────────────────────┼─────────────┼────────│
│ 🛡️ Admin      │ Full system access       │     12      │   2    │
│ 💻 Developer  │ Development environment  │      8      │  15    │
│ 👁️ Viewer     │ Read-only access         │      3      │  45    │
│ ✅ Approver   │ Can approve requests     │      5      │   8    │
└─────────────────────────────────────────────────────────────────┘
```

### Approval Inbox
```
┌─────────────────────────────────────────────────────────────────┐
│ Access Requests                     [Pending] [Approved] [All]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🟡 John Doe                                    2 hours ago  ││
│ │    john@company.com                                         ││
│ │                                                             ││
│ │    Requesting: Developer Role                               ││
│ │                                                             ││
│ │    "I need developer access to work on the new auth        ││
│ │     module for Project Alpha."                              ││
│ │                                                             ││
│ │    Duration: 30 days                                        ││
│ │                                                             ││
│ │                           [Deny]  [✓ Approve]               ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
authz-platform/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/           # API endpoints
│   │   │   ├── dependencies.py   # DI (get_db, get_user)
│   │   │   ├── middleware.py     # CORS, errors
│   │   │   └── rate_limit.py     # Rate limiting
│   │   ├── core/
│   │   │   ├── security.py       # JWT, hashing
│   │   │   ├── exceptions.py     # Custom exceptions
│   │   │   └── constants.py      # Enums
│   │   ├── db/
│   │   │   ├── models/           # SQLAlchemy models
│   │   │   └── database.py       # Engine, sessions
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # Business logic
│   │   ├── config.py             # Settings
│   │   └── main.py               # App entry
│   ├── tests/                    # Pytest tests
│   ├── alembic/                  # Migrations
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client & hooks
│   │   ├── components/
│   │   │   ├── ui/               # Base components
│   │   │   ├── roles/
│   │   │   ├── users/
│   │   │   ├── permissions/
│   │   │   ├── requests/
│   │   │   ├── audit/
│   │   │   └── command/          # Command palette
│   │   ├── layouts/              # App shell
│   │   ├── pages/                # Route pages
│   │   ├── stores/               # Zustand stores
│   │   ├── hooks/
│   │   ├── lib/                  # Utilities
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css             # Theme
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Environment Variables

### Backend (.env)

```bash
# Application
APP_NAME=AuthZ Platform
DEBUG=true
API_PREFIX=/api

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/authz

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OAUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

### Frontend

The frontend uses Vite's environment variables. Create a `.env` file:

```bash
VITE_API_URL=http://localhost:8000/api
```

---

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

**Test Coverage:**
- Authentication: 7 tests
- Roles: 5 tests
- Policies: 5 tests
- Requests: 7 tests
- **Total: 24 tests passing**

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Command palette |
| `/` | Focus search |
| `Esc` | Close / unfocus |
| `j` | Next item |
| `k` | Previous item |
| `a` | Assign action |
| `T` | Toggle theme |
| `G D` | Go to Dashboard |
| `G R` | Go to Roles |
| `G P` | Go to Permissions |
| `G U` | Go to Users |
| `G A` | Go to Requests |
| `G L` | Go to Audit |

---

## Authorization Concepts

### RBAC (Role-Based Access Control)

Users are assigned roles, roles have permissions:

```
User: john@example.com
  └── Role: Developer
        ├── Permission: database:read
        ├── Permission: database:write
        └── Permission: api:access
```

### PBAC (Policy-Based Access Control)

Policies define who can do what on which resources:

```json
{
  "name": "Engineers can read production databases",
  "effect": "allow",
  "principals": {
    "roles": ["Engineer", "Senior Engineer"]
  },
  "actions": ["database:read", "database:list"],
  "resources": ["database:production:*"],
  "conditions": {
    "user.department": { "equals": "engineering" }
  }
}
```

### Policy Evaluation

1. Gather user's roles
2. Find matching policies
3. Evaluate conditions
4. **DENY wins over ALLOW**
5. Default: DENY

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


---

<div align="center">

**Built by [Keyur Pawaskar](https://github.com/keyur7523)**

⭐ Star this repo if you found it helpful!

</div>
