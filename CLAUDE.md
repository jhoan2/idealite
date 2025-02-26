# CLAUDE.md - Idealite Codebase Guide

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run start` - Start production server
- `npm run db:generate` - Generate Drizzle database schema
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Launch Drizzle Studio

## Code Style Guidelines
- **TypeScript**: Use strict typing. Prefer `type-imports` with inline style.
- **React**: Use functional components with hooks. Use React 18 features.
- **Formatting**: Uses Prettier with tailwindcss plugin.
- **Component Pattern**: Follow shadcn/ui pattern with destructured props and cn utility.
- **CSS**: Use Tailwind with class-variance-authority for component variants.
- **Imports**: Group imports by: React/Next, third-party libs, then local imports with `~/` alias.
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files.
- **Error Handling**: Use try/catch blocks and handle async errors with proper user feedback.

## Environment
- Next.js 14 application with TypeScript
- Drizzle ORM with PostgreSQL
- Farcaster integration
- TailwindCSS for styling