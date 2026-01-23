# AuthZ Platform Backend

A FastAPI-based authorization platform with RBAC, policy-based access control, and approval workflows.

## Features

- **Authentication**: JWT-based auth with refresh token rotation
- **Organizations**: Multi-tenant organization management with invites
- **RBAC**: Role-based access control with custom roles and permissions
- **Policies**: Flexible policy engine with allow/deny rules
- **Approval Workflows**: Access request system with approve/deny/request-info actions
- **Audit Logging**: Comprehensive audit trail for all actions
- **OAuth**: GitHub and Google OAuth integration (optional)

## Requirements

- Python 3.11+
- PostgreSQL 14+

## Setup

1. **Clone and install dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

3. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start the server**
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```

5. **View API docs**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Running Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/        # API endpoints
│   │   └── dependencies.py
│   ├── core/
│   │   ├── security.py    # JWT, password hashing
│   │   └── exceptions.py  # Custom exceptions
│   ├── db/
│   │   ├── models/        # SQLAlchemy models
│   │   └── database.py    # DB connection
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── config.py
│   └── main.py
├── tests/
├── alembic/               # Database migrations
├── requirements.txt
└── .env.example
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | Login and get tokens |
| `POST /api/auth/refresh` | Refresh access token |
| `GET /api/auth/me` | Get current user with orgs |
| `POST /api/orgs` | Create organization |
| `GET /api/orgs/{id}/roles` | List roles |
| `POST /api/orgs/{id}/policies` | Create policy |
| `POST /api/orgs/{id}/requests` | Submit access request |
| `GET /api/orgs/{id}/audit` | Query audit logs |

## License

MIT
