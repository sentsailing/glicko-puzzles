# Math ELO Platform - Product Specification

> Single source of truth for the Math ELO Platform MVP

## Overview

A competitive math practice platform where users solve problems matched to their skill level. Ratings update after each attempt using an ELO-based system (designed to support Glicko-2 later).

---

## MVP Features

### In Scope
- [x] Anonymous play with session-based tracking (cookie/localStorage)
- [x] Problem display with difficulty rating
- [x] Answer submission (numeric input)
- [x] ELO rating calculation after each attempt
- [x] Problem selection: match user rating to closest problem rating
- [x] Basic stats page: current rating, problems attempted, accuracy
- [x] Seed script with ~30 math problems across difficulty levels

### Out of Scope (Future)
- [ ] User authentication/accounts
- [ ] Leaderboards
- [ ] Problem categories/tags filtering
- [ ] Time limits per problem
- [ ] Hints or explanations
- [ ] Admin panel for problem management
- [ ] Glicko-2 rating system (interface ready, not implemented)

---

## Data Model

### Player
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| sessionToken | String | Unique session identifier |
| rating | Float | Current ELO rating (default: 1200) |
| ratingDeviation | Float? | For Glicko (nullable for ELO) |
| gamesPlayed | Int | Total attempts made |
| createdAt | DateTime | Account creation time |
| updatedAt | DateTime | Last activity time |

### Problem
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| content | Text | Problem text (supports LaTeX) |
| answer | String | Correct answer |
| rating | Float | Problem difficulty rating |
| ratingDeviation | Float? | For Glicko (nullable for ELO) |
| difficulty | Enum | EASY, MEDIUM, HARD (human label) |
| createdAt | DateTime | Creation time |

### Attempt
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| playerId | UUID | Foreign key to Player |
| problemId | UUID | Foreign key to Problem |
| answer | String | Player's submitted answer |
| correct | Boolean | Whether answer was correct |
| ratingBefore | Float | Player rating before attempt |
| ratingAfter | Float | Player rating after attempt |
| createdAt | DateTime | Submission time |

---

## Routes

### Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with "Start Playing" CTA |
| `/play` | Main game: displays problem, accepts answer |
| `/play/result` | Shows result of last attempt, next problem button |
| `/stats` | Player statistics dashboard |

### API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/player` | Get or create player session |
| GET | `/api/problem/next` | Fetch next problem matched to rating |
| POST | `/api/attempt` | Submit answer, returns result + new rating |
| GET | `/api/stats` | Get player statistics |

---

## Rating System

### Interface (Swappable Design)
```typescript
interface RatingSystem {
  calculateNewRatings(
    playerRating: number,
    problemRating: number,
    playerWon: boolean,
    playerRD?: number,
    problemRD?: number
  ): {
    newPlayerRating: number;
    newProblemRating: number;
    newPlayerRD?: number;
    newProblemRD?: number;
  };
}
```

### ELO Implementation
- **K-factor**: 32 (standard)
- **Default rating**: 1200
- **Rating range**: 400-2800
- **Expected score**: `E = 1 / (1 + 10^((Rb - Ra) / 400))`
- **New rating**: `Ra' = Ra + K * (S - E)` where S = 1 (win) or 0 (loss)

### Problem Rating Adjustment
- Problems also have ratings that adjust (with lower K-factor of 16)
- Correct answer = player "wins", problem "loses"
- Incorrect answer = problem "wins", player "loses"

---

## Folder Structure

```
glicko/
├── PRODUCT_SPEC.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── play/
│   │   │   ├── page.tsx
│   │   │   └── result/
│   │   │       └── page.tsx
│   │   ├── stats/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── player/
│   │       │   └── route.ts
│   │       ├── problem/
│   │       │   └── next/
│   │       │       └── route.ts
│   │       ├── attempt/
│   │       │   └── route.ts
│   │       └── stats/
│   │           └── route.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── rating/
│   │   │   ├── index.ts
│   │   │   ├── elo.ts
│   │   │   └── glicko.ts
│   │   └── problems.ts
│   ├── components/
│   │   ├── Problem.tsx
│   │   ├── AnswerForm.tsx
│   │   ├── ResultCard.tsx
│   │   └── StatsDisplay.tsx
│   └── types/
│       └── index.ts
└── README.md
```

---

## Implementation Plan

| Step | Status | Description |
|------|--------|-------------|
| 1 | [x] | Initialize Next.js + TypeScript project |
| 2 | [x] | Add Prisma + PostgreSQL setup |
| 3 | [x] | Define data models in Prisma |
| 4 | [x] | Create rating system abstraction + ELO impl |
| 5 | [x] | Create seed script with 30 problems |
| 6 | [x] | Implement player API |
| 7 | [x] | Implement problem selection + API |
| 8 | [x] | Implement attempt submission API |
| 9 | [x] | Implement stats API |
| 10 | [x] | Create shared types |
| 11 | [x] | Build landing page |
| 12 | [x] | Build problem/answer components |
| 13 | [x] | Build play page |
| 14 | [x] | Build result page |
| 15 | [x] | Build stats page |
| 16 | [x] | Add styling (Tailwind) |
| 17 | [ ] | Testing + polish |

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **State**: React hooks + cookies for session

---

## Sample Problems Rating Distribution

| Difficulty | Rating Range | Count |
|------------|--------------|-------|
| EASY | 800-1100 | 10 |
| MEDIUM | 1100-1500 | 12 |
| HARD | 1500-2000 | 8 |

---

*Last updated: 2026-01-22*
