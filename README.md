# 🚀  HubSpot Integration Assessment

> **Assessment Project**: This is a technical assessment submission  demonstrating OAuth 2.0 implementation and API integration skills.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/MUI-0081CB?style=flat-square&logo=material-ui&logoColor=white)](https://mui.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)

---

## 📝 Assessment Overview

This project completes the VectorShift technical assessment requirements:

- ✅ **Part 1**: HubSpot OAuth 2.0 authorization flow with secure state validation
- ✅ **Part 2**: HubSpot CRM API integration (contacts, companies, deals)

**Tech Stack**: FastAPI (Python) + React + Redis + Material-UI

---

## ✨ Key Features

- **OAuth 2.0 Flow** with CSRF protection via state tokens
- **Redis-based** secure credential storage
- **HubSpot CRM API** integration with pagination support
- **Material-UI** responsive interface with card-based data display
- **Async/Await** patterns for non-blocking operations

---

## 📦 Prerequisites

- Python 3.8+
- Node.js 14+
- Redis Server
- HubSpot Developer Account ([Sign up](https://developers.hubspot.com/))

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/vectorshift-assessment.git
cd vectorshift-assessment
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Start Redis
```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Windows - Use Docker
docker run -d -p 6379:6379 redis:latest

# Verify
redis-cli ping  # Should return: PONG
```

### 5. Configure HubSpot Credentials

Edit `/backend/integrations/hubspot.py`:
```python
CLIENT_ID = 'your_hubspot_client_id'
CLIENT_SECRET = 'your_hubspot_client_secret'
```

**HubSpot App Settings**:
- Redirect URL: `http://localhost:8000/integrations/hubspot/oauth2callback`
- Scopes: `crm.objects.contacts.read`, `crm.objects.companies.read`, `crm.objects.deals.read`

### 6. Run Application
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend  
cd frontend
npm start
```

**Access**: http://localhost:3000

---

## 🎮 Usage

1. Select **"HubSpot"** from integration dropdown
2. Click **"Connect to HubSpot"**
3. Complete OAuth authorization in popup
4. Click **"Load Data"** to fetch CRM objects
5. View contacts, companies, and deals in card format

---

## 🏗️ Project Structure

```
backend/
├── integrations/
│   └── hubspot.py           # ✅ OAuth & API implementation
├── main.py                  # FastAPI routes
└── requirements.txt

frontend/
├── src/
│   ├── integrations/
│   │   └── hubspot.js       # ✅ React OAuth component
│   ├── integration-form.js  # ✅ Updated with HubSpot
│   └── data-form.js         # ✅ Enhanced UI
└── package.json
```

---

## 🔐 Security Implementation

- **CSRF Protection**: Cryptographically secure state tokens
- **State Validation**: Redis-backed verification
- **Credential Storage**: Server-side with TTL expiration
- **Secure Redirects**: HTTPS enforcement for OAuth

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/integrations/hubspot/authorize` | Initiate OAuth |
| `GET` | `/integrations/hubspot/oauth2callback` | OAuth callback |
| `POST` | `/integrations/hubspot/credentials` | Retrieve credentials |
| `POST` | `/integrations/hubspot/get_hubspot_items` | Fetch CRM data |

---

## 🐛 Troubleshooting

**Redis Connection Error**:
```bash
# Check if Redis is running
redis-cli ping
```

**OAuth Scope Mismatch**:
- Verify scopes in HubSpot app match code configuration

**Port Already in Use**:
```bash
# Backend (8000)
lsof -ti:8000 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Implementation Details

### OAuth Flow
1. User initiates authorization
2. Backend generates secure state token
3. User redirects to HubSpot
4. HubSpot callback with authorization code
5. Backend validates state and exchanges code for token
6. Credentials stored in Redis with TTL

### Data Processing
- Fetches contacts, companies, and deals via HubSpot API
- Handles pagination for large datasets
- Transforms API responses to `IntegrationItem` format
- Displays in grouped card layout by object type

---



