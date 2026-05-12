
## Test Account with pre-loaded Data
- Email: user@exam.com
- Password: 123456

## How to Run

### Backend (Node.js + Express + Sequelize)
1) Install dependencies:
```bash
cd backend
npm install
```

2) Configure environment variables:
- Copy template:
```bash
cp .env.template .env
```
- Update `.env` with your values:
  - `DB_URL` (PostgreSQL connection string)
  - `DB_CA_BASE64` (Base64 encoded CA certificate, required for SSL-managed Postgres)
  - `JWT_SECRET`
  - `OPENAI_API_KEY` (only needed for recipe generation)
  - `PORT` (default `6390`)
  - `CORS_ORIGIN` (default allows `http://localhost:5173`)

3) Start the backend:
```bash
npm run start
```

Backend runs on `http://localhost:6390` by default.

### Frontend (React + Vite)
1) Install dependencies:
```bash
cd frontend
npm install
```

2) Start the frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

