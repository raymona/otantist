# Otantist

**The First Emotionally Safe Social Platform for Autistic Individuals**

Otantist is a bilingual (French/English) social platform designed specifically for autistic individuals, featuring adaptive communication preferences, sensory controls, and comprehensive safety features.

---

## 🌟 Key Features

- **"How to Talk to Me" Profiles** — Users share their communication preferences
- **Calm Mode** — One-tap sensory load reduction
- **Time Boundaries** — Automatic message queuing outside preferred hours
- **1:1 Messaging** — Safe, private conversations
- **Parent Dashboard** — Oversight tools for parent-managed accounts
- **Human Moderation** — AI-assisted flagging with human decision-making

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/otantist.git
cd otantist

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Docker services (PostgreSQL, Redis, Mailhog)
npm run docker:up

# Initialize database
cd apps/api
npx prisma generate
npx prisma migrate dev
cd ../..

# Start development servers
npm run dev:api   # API on http://localhost:3001
npm run dev:web   # Web on http://localhost:3000
```

See [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for complete setup instructions.

---

## 📁 Project Structure

```
otantist/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js web app
│   └── mobile/       # React Native + Expo
├── packages/
│   ├── shared/       # Shared types & constants
│   └── ui/           # Shared UI components
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo |
| Web | Next.js 14 |
| API | NestJS |
| Database | PostgreSQL |
| Cache | Redis |
| Real-time | Socket.io |
| AI | Claude API (background moderation) |

---

## 📖 Documentation

- [Developer Guide](docs/DEVELOPER_GUIDE.md) — Setup and workflow
- [API Documentation](http://localhost:3001/api/docs) — Swagger UI (when running)
- [Technical Architecture](docs/architecture.md) — System design

---

## 🔒 Security & Privacy

- PIPEDA & Québec Law 25 compliant
- Minimal data collection
- Human moderation for all flagged content
- Parent oversight for minor accounts
- End-to-end encrypted messaging (Phase 2)

---

## 🌐 Languages

Otantist is fully bilingual from day one:
- 🇫🇷 French (default)
- 🇬🇧 English

---

## 📄 License

Proprietary — All rights reserved.

---

## 🤝 Contributing

This is currently a private project. Contact the team for contribution guidelines.

---

*Built with ❤️ for the autism community*
