# ⚡ ExpenseFlow — Telegram-Powered Personal Expense Tracker

A full-stack personal finance application where **Telegram** is the frictionless primary input method. Users can send natural language expense and income messages to a Telegram Bot, which automatically extracts details, parses dates/merchants/payment methods, stores them in a relational database, and synchronizes with a React + Tailwind CSS dashboard for live financial analytics, budget monitoring, recurring schedules, and multi-format exports.

---

## 📸 Key Features

- 💬 **Frictionless Telegram Input**: Log transactions via conversational English and Hinglish phrases (`Spent 250 on dinner`, `₹500 petrol`, `200 kharch kiye food pe`, `mom gave me 2000`, `150 chai`).
- 🧠 **Hybrid AI & Local NLP Engine**: Structured outputs powered by LLM (OpenAI API) with an ultra-reliable regex & Hinglish local NLP fallback engine that runs offline with zero external dependencies.
- 📦 **Multi-Transaction Messages**: Automatically splits composite messages (`Today I spent 200 on breakfast, 150 on bus and 500 on shopping` -> 3 distinct database records).
- ❓ **Interactive Clarification Dialogues**: For ambiguous inputs (e.g. `500`), prompts the user with inline category selection buttons instead of guessing silently.
- 🔄 **Strict Webhook Idempotency**: `update_id` deduplication prevents duplicate transactions during Telegram webhook retries.
- 🎯 **Budget Health & Warnings**: Monthly budget tracking with automatic color-coded threshold alerts at **75%**, **90%**, and **100% (Exceeded)**.
- 🔁 **Recurring Transactions Scheduler**: Automated background processor for daily, weekly, monthly, and yearly subscriptions (Rent, Netflix, Spotify, WiFi).
- 📊 **Smart Financial Insights**: Month-over-Month category shifts, highest spending category, daily spending velocity, peak weekday analysis, and savings rate.
- 📥 **Multi-Format Export**: One-click export of filtered transaction records to **CSV**, **Excel (.xlsx)**, and formatted **PDF Reports**.
- 🤖 **Embedded Telegram Bot Simulator**: Test natural language inputs directly from the web dashboard in real time with interactive chat bubbles and instant database updates.

---

## 🏗️ System Architecture

```text
Telegram User / Web Simulator
            ↓
   Webhook / REST API
            ↓
 AI & Regex NLP Parsing Layer  (Handles English, Indian English, Hinglish, Multi-split)
            ↓
   Transaction Service         (Budget checks: 75% / 90% / 100%, Idempotency)
            ↓
  PostgreSQL / SQLite + Prisma
            ↓
   REST API & Auth Layer       (JWT, User Isolation, Cron Scheduler)
            ↓
 React + Tailwind CSS Dashboard (Recharts, Overview Cards, Filters, CRUD Modals)
```

---

## 📁 Complete Folder Structure

```text
.
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # Relational database models & indexes
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts               # Environment config & Prisma client singleton
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts     # User register, login, profile settings
│   │   │   ├── budget.controller.ts   # Category budget limits & alert queries
│   │   │   ├── category.controller.ts # Category CRUD & default categories
│   │   │   ├── dashboard.controller.ts# Summary cards, donut, monthly & daily charts
│   │   │   ├── export.controller.ts   # CSV, Excel (.xlsx), and PDF generation
│   │   │   ├── insight.controller.ts  # Rule-based & statistical financial insights
│   │   │   ├── recurring.controller.ts# Recurring transaction manager & processor
│   │   │   ├── telegram.controller.ts # Webhook handler & Simulator endpoint
│   │   │   └── transaction.controller.ts # Full Transaction CRUD & undo logic
│   │   ├── db/
│   │   │   └── seed.ts                # Seed script for demo account & sample transactions
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts     # JWT verification middleware
│   │   │   └── error.middleware.ts    # Centralized error handler & Zod validator
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── budget.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── export.routes.ts
│   │   │   ├── insight.routes.ts
│   │   │   ├── recurring.routes.ts
│   │   │   ├── telegram.routes.ts
│   │   │   ├── transaction.routes.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── aiParser.service.ts    # AI (OpenAI) & Rule-based/Hinglish NLP parser
│   │   │   ├── auth.service.ts        # Password hashing & JWT token issuance
│   │   │   ├── budget.service.ts      # Spent calculation & 75%/90%/100% threshold checks
│   │   │   ├── export.service.ts      # XLSX, CSV, and PDFKit export engines
│   │   │   ├── insight.service.ts     # MoM shift & peak habit analysis engine
│   │   │   ├── recurring.service.ts   # Recurring cron processor
│   │   │   ├── telegram.service.ts    # Telegram Bot API client & commands router
│   │   │   └── transaction.service.ts # Transaction CRUD & category resolver
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript types & Zod schemas
│   │   └── server.ts                  # Express app bootstrap, Cron, Telegram listener
│   ├── tests/
│   │   ├── budget.test.ts             # Budget calculations & threshold alert tests
│   │   ├── parser.test.ts             # Natural language expense & income parsing tests
│   │   ├── transaction_isolation.test.ts # User data isolation & undo tests
│   │   └── webhook_idempotency.test.ts# Idempotency & duplicate retry tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BudgetCard.tsx         # Visual progress bar with 75%/90%/100% alert badge
│   │   │   ├── BudgetModal.tsx        # Set category budget modal
│   │   │   ├── CategoryModal.tsx      # Create custom category with color picker
│   │   │   ├── DailyAreaChart.tsx     # Recharts Area chart of daily spending burn rate
│   │   │   ├── DeleteConfirmModal.tsx # Safe deletion modal
│   │   │   ├── ExpenseDonutChart.tsx  # Recharts Pie/Donut with category breakdown
│   │   │   ├── ExportModal.tsx        # Filter-aware export to CSV, Excel, PDF
│   │   │   ├── FilterBar.tsx          # Dynamic date presets & filter dropdowns
│   │   │   ├── InsightsPanel.tsx      # Highlights & spending habit cards
│   │   │   ├── MonthlyBarChart.tsx    # Recharts Income vs Expense bar comparison
│   │   │   ├── Navbar.tsx             # Top bar with search & quick actions
│   │   │   ├── RecurringModal.tsx     # Manage subscriptions & auto-bills
│   │   │   ├── Sidebar.tsx            # Modern navigation with Telegram simulator trigger
│   │   │   ├── StatCard.tsx           # Metric cards with percentage change badges
│   │   │   ├── TelegramSimulatorModal.tsx # Interactive chat UI for testing Telegram inputs
│   │   │   └── TransactionModal.tsx   # Add/Edit transaction with validation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Auth state, login, register, 1-click demo login
│   │   │   └── FilterContext.tsx      # Global filter state (date range, type, category)
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx      # Deep-dive charts & intelligence
│   │   │   ├── BudgetsPage.tsx        # Budget health dashboard
│   │   │   ├── CategoriesPage.tsx     # Categories list & custom creator
│   │   │   ├── DashboardPage.tsx      # Main overview dashboard
│   │   │   ├── LoginPage.tsx          # Sign in with 1-click Demo Account button
│   │   │   ├── RecurringPage.tsx      # Recurring commitments hub
│   │   │   ├── RegisterPage.tsx       # Sign up page
│   │   │   ├── SettingsPage.tsx       # Currency, timezone, Telegram bot guide
│   │   │   └── TransactionsPage.tsx   # Dedicated full transaction manager
│   │   ├── services/
│   │   │   └── api.ts                 # Axios client with interceptors
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx                    # Root routing & layout
│   │   ├── index.css                  # Tailwind styles & glassmorphism
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── package.json                       # Root script shortcuts
└── README.md
```

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Zod, bcryptjs, jsonwebtoken, date-fns, node-cron
- **Database & ORM**: PostgreSQL / SQLite, Prisma ORM
- **Telegram**: Telegram Bot API (Webhooks & Long-Polling)
- **AI & NLP**: OpenAI API (`gpt-4o-mini` structured output) + Local Regex & Hinglish Rule-Based Engine
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios, XLSX, PDFKit

---

## ⚙️ Environment Variables

Create `.env` in `backend/` (or copy from `.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (SQLite by default for zero-setup local dev, or PostgreSQL connection string)
DATABASE_URL="file:./dev.db"
# Example PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/expensetracker?schema=public"

# Authentication
JWT_SECRET=super-secret-jwt-key-for-expense-tracker-production-ready

# Telegram Bot (Optional - use Simulator in Dashboard or provide token)
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
TELEGRAM_USE_POLLING=true

# Google Gemini AI (Free tier from Google AI Studio: https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Optional OpenAI Fallback
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js v18+ (tested on v24)
- npm v9+

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed     # Seeds demo user (demo@example.com / password123) and sample transactions
npm run dev         # Starts backend on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev         # Starts frontend on http://localhost:5173
```

### 4. Running Tests
```bash
cd backend
npm test            # Runs all 4 test suites (Parser, Budgets, Webhooks, Isolation)
```

---

## 🤖 Setting Up a Live Telegram Bot

1. Open Telegram and search for **`@BotFather`**.
2. Send `/newbot`, choose a name (e.g. `MyExpenseTrackerBot`) and a username ending in `bot`.
3. Copy the **API Token** provided by BotFather.
4. Paste it into `backend/.env`:
   ```env
   TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
   ```
5. For local testing without a public domain, set:
   ```env
   TELEGRAM_USE_POLLING=true
   ```
6. For production (with HTTPS domain), set:
   ```env
   TELEGRAM_WEBHOOK_URL="https://your-backend.com/api/telegram/webhook"
   TELEGRAM_USE_POLLING=false
   ```
7. Start the backend and message `/start` to your bot on Telegram!

---

## 💬 Example Telegram Natural Language Messages

Try sending any of these to the bot (or through the Web Dashboard's **Telegram Simulator**):

### Single Expenses
- `Spent 250 on dinner`
- `₹500 petrol`
- `Bought clothes for 1800 yesterday`
- `150 chai`
- `Spent 750 on groceries at Dmart`
- `₹120 Uber to college`
- `Paid 12000 rent`
- `Spent 350 on dinner at Domino's yesterday using UPI`

### Incomes
- `Got salary 35000`
- `Received 5000 from dad`
- `mom gave me 2000`
- `salary 40000 received`
- `Received 2000 refund`

### Informal Indian-English / Hinglish
- `200 kharch kiye food pe`
- `aaj 500 petrol`
- `paid 1000 for electricity`
- `spent 300 on movie`
- `₹500 shopping via UPI`

### Multiple Transactions in One Message
- `Today I spent 200 on breakfast, 150 on bus and 500 on shopping`
- `350 on lunch and 120 on auto`

### Ambiguity Clarification Trigger
- `500` *(Prompts: "I understood ₹500 as an expense, but I'm not sure about the category...")*

### Bot Commands
- `/start` — Introduction and setup guide
- `/help` — Full cheatsheet of commands
- `/summary` — Today's spending & overall balance
- `/today` — List of transactions made today
- `/month` — Current month breakdown and top categories
- `/categories` — Monthly category spending
- `/undo` — Revert most recently recorded transaction
- `/recent` — Last 10 transactions with inline action buttons

---

## 🌐 Production Deployment Guide

### Database (PostgreSQL)
- Create a free database on **Supabase**, **Neon**, or **Railway**.
- In `backend/.env`, set:
  ```env
  DATABASE_URL="postgresql://user:password@db-host.neon.tech/expensetracker?sslmode=require"
  ```
- Change `provider = "postgresql"` in `backend/prisma/schema.prisma` and run `npx prisma db push`.

### Backend Deployment (Render / Railway / Fly.io)
- Connect GitHub repo and set root directory to `backend`.
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npm start`
- Add all environment variables from `.env.example`.

### Frontend Deployment (Vercel / Netlify)
- Set root directory to `frontend`.
- Build command: `npm run build`
- Output directory: `dist`
- Configure `VITE_API_URL` to point to your live backend domain.

---

## 🛡️ Security & Privacy Principles
- **No Token Exposure**: Telegram Bot tokens and OpenAI API keys are strictly kept on the backend.
- **Strict User Isolation**: All transactions, budgets, and categories are tied to the authenticated user's ID.
- **Input Validation**: All incoming requests and webhooks are validated with Zod schemas.
- **Parameterization**: Prisma ORM ensures SQL injection prevention across all queries.
"# expenseflow" 
