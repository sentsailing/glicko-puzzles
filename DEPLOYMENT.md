# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, or self-hosted)
- Firebase project with Google sign-in enabled
- Hosting platform (Vercel recommended for Next.js)

## Environment Variables

All variables must be set in your hosting provider's dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string with `?sslmode=require` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `FIREBASE_PROJECT_ID` | Yes | Firebase admin project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key |
| `ADMIN_EMAILS` | No | Comma-separated admin emails for /api/admin access |
| `NODE_ENV` | No | Set to `production` for production builds |

### Database Connection Pooling

For serverless deployments (Vercel, etc.), add connection pooling parameters to your DATABASE_URL:

```
postgresql://user:pass@host/db?sslmode=require&connection_limit=10&pool_timeout=20
```

## Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Set all environment variables in the Vercel dashboard
3. The build command is already configured: `prisma generate && next build`
4. After first deploy, run database migrations:
   ```bash
   npx prisma db push
   npm run db:seed  # Load initial problems
   ```

## Pre-Deployment Checklist

- [ ] All environment variables set in hosting dashboard
- [ ] Database connection string uses SSL and connection pooling
- [ ] Firebase private key is properly escaped (newlines as `\n`)
- [ ] ADMIN_EMAILS configured for admin access
- [ ] Database schema pushed (`prisma db push`)
- [ ] Initial problems seeded (`npm run db:seed`)
- [ ] Tested Google sign-in flow
- [ ] Verified admin access is restricted

## Security Notes

- Never commit `.env` files to version control
- Rotate all credentials if they were ever exposed
- The admin API requires Firebase authentication + email allowlist
- Rate limiting is applied to all API endpoints
