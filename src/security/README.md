# HausPet Security App

This is the **authentication frontend** for the HausPet system.

## Purpose

Handles user authentication and login functionality:
- Login page
- JWT token management
- Session handling via AuthContext

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Zod** - Schema validation

## Project Structure

```
src/
├── components/
│   ├── Login.tsx           # Login form component
│   └── ProtectedRoute.tsx  # Route guard component
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── services/
│   └── auth.service.ts     # API client for auth endpoints
├── types/
│   └── auth.types.ts       # TypeScript types
├── App.tsx                 # Main app with routing
└── main.tsx                # Entry point
```

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (port 5174)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:3000  # API backend URL
```

## Integration

This app is designed to work with:
- **Backend App** (`src/backend/`) - Shares AuthContext
- **API Server** (`src/api/`) - Consumes `/api/auth/*` endpoints

## Routing

- `/` → Redirects to `/login`
- `/login` → Login page
- All other routes → Redirect to `/login`

## Deployment

In production, this app is served at the **root path** (`/`) through the Nginx reverse proxy.

Access URL (prod): `https://yourdomain.com/`
