# Hotelogx Connect Backend

Production-grade Express + Prisma + MySQL backend for Hotelogx Connect.

## Setup Instructions

### 1. Configure MySQL Database Credentials
Open `backend/.env` and update `DATABASE_URL` with your MySQL username and password:
```env
DATABASE_URL="mysql://<YOUR_USER>:<YOUR_PASSWORD>@localhost:3306/hotel_db"
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Generate Prisma Client & Push Schema to MySQL
```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Initial Hotel Mercier Data
```bash
npm run prisma:seed
```

### 5. Start Backend Server
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

---

## Available API Endpoints

- **Health Check**: `GET /api/health`
- **Auth**:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/auth/staff`
- **Rooms**:
  - `GET /api/rooms`
  - `GET /api/rooms/:number`
  - `PATCH /api/rooms/:number/status`
- **Tasks**:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id/status`
- **Issues (Maintenance)**:
  - `GET /api/issues`
  - `POST /api/issues`
  - `PATCH /api/issues/:id/status`
- **Conversations & Guest Chat**:
  - `GET /api/conversations`
  - `GET /api/conversations/:id`
  - `POST /api/conversations/:id/reply`
  - `POST /api/conversations/:id/takeover`
- **Manager Portal**:
  - `GET /api/manager/briefing`
  - `GET /api/manager/activity`
  - `GET /api/manager/rules`
  - `GET /api/manager/knowledge`
- **Upsells Pipeline**:
  - `GET /api/upsells`
  - `PATCH /api/upsells/:id/status`
- **WhatsApp Simulator**:
  - `GET /api/whatsapp/threads`
  - `POST /api/whatsapp/action`
