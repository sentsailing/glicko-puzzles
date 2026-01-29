# Glicko Puzzles

A math problem practice app that rates both players and problems using the [Glicko-2 rating system](http://www.glicko.net/glicko/glicko2.pdf). Solve problems matched to your skill level and track your improvement over time.

## Features

- **Glicko-2 ratings** for both players and problems, with rating deviation and volatility tracking
- **Adaptive problem selection** based on player rating
- **LaTeX rendering** for math content via KaTeX
- **Multiple choice and free response** problem types
- **Google sign-in** via Firebase Authentication (anonymous play also supported)
- **Per-attempt history** with rating progression tracking

## Tech Stack

- Next.js 15 (App Router)
- PostgreSQL + Prisma
- Firebase Authentication
- KaTeX
- Tailwind CSS
- TypeScript

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### Installation

```bash
git clone https://github.com/sentsailing/glicko-puzzles.git
cd glicko-puzzles
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

You'll need:
- A PostgreSQL database connection string
- A [Firebase project](https://console.firebase.google.com) with Google sign-in enabled
- Firebase Admin SDK service account credentials

### Database

```bash
npx prisma generate
npx prisma db push
npm run db:seed    # loads sample problems
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Rating System

Implements [Glickman's Glicko-2 algorithm](http://www.glicko.net/glicko/glicko2.pdf):

- Default rating: 1500, RD: 350, volatility: 0.06
- Both players and problems are rated independently after each attempt
- Uses the Illinois method for volatility estimation
- Scale factor: 173.7178 (Glicko-2 to Glicko-1 conversion)

## License

MIT
