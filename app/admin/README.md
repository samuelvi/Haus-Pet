# HausPet Backend Management App

This is the **admin panel frontend** for managing the HausPet breed database.

## Purpose

Provides a protected admin interface for CRUD operations:
- Dashboard with user info
- Breed listing with search and filters
- Create, update, and delete breeds
- All routes protected (requires authentication)

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx       # Admin dashboard
│   ├── BreedList.tsx       # Breed listing with filters
│   └── BreedForm.tsx       # Create/Edit breed form
├── services/
│   └── breed.service.ts    # API client for breed endpoints
├── types/
│   └── breed.types.ts      # TypeScript types
├── schemas/
│   └── breed.schema.ts     # Zod validation schemas
├── App.tsx                 # Main app with protected routing
└── main.tsx                # Entry point
```

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (port 5175)
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

This app depends on:
- **Security App** (`src/security/`) - Imports AuthContext for authentication
- **API Server** (`src/api/`) - Consumes `/api/breeds/*` endpoints

## Routing

All routes are protected with `ProtectedRoute` component:

- `/` → Redirects to `/dashboard`
- `/dashboard` → Admin dashboard (protected)
- `/breeds` → Breed list (protected)
- `/breeds/new` → Create new breed (protected)
- `/breeds/edit/:id` → Edit breed (protected)

If not authenticated, users are redirected to `/login` (Security App).

## Security

**All routes in this app require authentication.**

The `ProtectedRoute` component:
1. Checks `isAuthenticated` from AuthContext
2. Redirects to `/login` if not authenticated
3. Shows loading state while checking authentication

## Deployment

In production, this app is served at `/backend/*` through the Nginx reverse proxy.

Access URL (prod): `https://yourdomain.com/backend/`

## CRUD Operations

All write operations (Create, Update, Delete) require:
- Valid access token in `Authorization` header
- Session ID in `x-session-id` header

These are automatically managed by the `breedService` using tokens from AuthContext.
