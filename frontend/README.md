# Helpernote Frontend

Next.js 15 frontend application for the Helpernote job matching platform.

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS with OKLCH color system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (dashboard)/        # Dashboard route group
│   │   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   │   └── dashboard/      # Dashboard pages
│   │   │       └── page.tsx    # Main dashboard page
│   │   ├── login/              # Login page
│   │   │   └── page.tsx
│   │   ├── register/           # Register page
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (redirects to login)
│   │   └── globals.css         # Global styles with OKLCH colors
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── dropdown-menu.tsx
│   │   ├── sidebar.tsx         # Sidebar navigation
│   │   └── header.tsx          # Header with user menu
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── utils.ts            # cn() utility for className merging
│   │   ├── api-client.ts       # Axios instance with JWT interceptors
│   │   ├── auth.ts             # Authentication API
│   │   ├── customer.ts         # Customer API
│   │   ├── job-posting.ts      # Job posting API
│   │   └── matching.ts         # Matching API
│   │
│   └── types/                  # TypeScript type definitions
│       ├── user.ts
│       ├── customer.ts
│       ├── job-posting.ts
│       └── matching.ts
│
├── public/                     # Static assets
├── .env                        # Environment variables
├── .env.local                  # Local environment variables (copy from .env)
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies

```

## Getting Started

### Prerequisites

- Node.js 20+ installed
- Backend API running on http://localhost:8000 (or configure in .env)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env` to `.env.local` and update if needed:

```bash
cp .env .env.local
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

If using the sample data from the backend:

- **Username**: `admin`
- **Password**: `password123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Color System

The application uses an OKLCH-based color system for better perceptual uniformity:

- Light mode: High contrast with crisp backgrounds
- Dark mode: Comfortable dark theme with proper contrast

Colors are defined in `src/app/globals.css` using CSS custom properties.

## Authentication

The app uses JWT-based authentication:

1. Login/Register pages handle authentication
2. JWT token is stored in localStorage
3. API client automatically adds token to requests
4. Expired tokens redirect to login page

## API Integration

All API calls are handled through typed client libraries in `src/lib/`:

- `auth.ts` - Login, register, user profile
- `customer.ts` - Customer management, memos, files
- `job-posting.ts` - Job postings and job seeking
- `matching.ts` - Matching and settlement management

## Development Notes

- Uses Next.js 15 App Router (not Pages Router)
- Server Components by default, Client Components marked with "use client"
- TypeScript strict mode enabled
- All monetary values use number type (backend handles precision with DECIMAL)
- Korean language support throughout the UI

## Next Steps

After setting up the basic structure, you can:

1. Add shadcn/ui components using the CLI:
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```

2. Create additional dashboard pages:
   - Customer management page
   - Job postings page
   - Matchings page
   - Settlements page
   - Settings page

3. Implement advanced features:
   - Search and filtering
   - Pagination
   - File uploads
   - Memo system
   - Tag management

4. Add form validation with React Hook Form + Zod

5. Implement error boundaries and loading states

## License

Private project for Helpernote
