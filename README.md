# Better SaaS

A modern, full-stack SaaS application built with Next.js 15, featuring authentication, payments, file management, and internationalization.

## 🚀 Features

- **🔐 Authentication**: Email/password and social login (GitHub, Google) with Better Auth
- **💳 Payments**: Stripe integration with subscription management
- **📁 File Management**: Upload, preview, and manage files with AWS S3/R2 storage
- **🌍 Internationalization**: Multi-language support (English/Chinese)
- **📱 Responsive Design**: Modern UI with Radix UI and Tailwind CSS
- **📖 Documentation**: Built-in documentation system with Fumadocs
- **🔒 Protected Routes**: Role-based access control and route protection
- **⚡ Performance**: Optimized with Next.js 15 App Router and Turbo mode

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Payments**: Stripe
- **File Storage**: AWS S3/Cloudflare R2
- **Validation**: Zod

### Development
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Code Quality**: Biome
- **Environment**: @t3-oss/env-nextjs

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── (home)/        # Public pages
│   │   ├── (protected)/   # Protected dashboard pages
│   │   └── docs/          # Documentation
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── auth-guard.tsx     # Route protection
│   ├── blocks/            # Page sections
│   ├── dashboard/         # Dashboard components
│   ├── file-manager/      # File management
│   └── ui/                # Base UI components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication config
│   ├── payment/           # Stripe integration
│   └── utils.ts           # Helper functions
├── server/                # Server-side code
│   ├── actions/           # Server actions
│   └── db/                # Database layer
├── i18n/                  # Internationalization
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm
- PostgreSQL database
- Stripe account (for payments)
- AWS S3 or Cloudflare R2 (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd better-saas
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in the required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `BETTER_AUTH_SECRET`: Random secret for authentication
   - `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth app credentials
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth app credentials
   - `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Stripe API keys
   - `R2_*`: Cloudflare R2 or AWS S3 configuration
   - `NEXT_PUBLIC_APP_URL`: Your app's URL

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Available Scripts

- `pnpm dev` - Start development server with Turbo mode
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm preview` - Build and start production server
- `pnpm check` - Run Biome checks
- `pnpm check:write` - Fix Biome issues
- `pnpm typecheck` - Run TypeScript checks
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio

## 🏗️ Architecture

### Authentication Flow
- Uses Better Auth for secure authentication
- Supports multiple providers (email/password, GitHub, Google)
- Session management with database persistence
- Role-based access control

### Database Design
- **Users**: User profiles and authentication data
- **Sessions**: Active user sessions
- **Files**: File metadata and storage references
- **Payments**: Stripe subscription and payment data
- **Payment Events**: Webhook event tracking

### File Management
- Secure file uploads with validation
- Image processing and thumbnail generation
- Cloud storage integration (S3/R2)
- File access control and permissions

### Payment System
- Stripe integration for subscriptions
- Webhook handling for payment events
- Subscription lifecycle management
- Billing dashboard and controls

## 🌍 Internationalization

The application supports multiple languages:
- English (default)
- Chinese (Simplified)

Language files are located in `src/i18n/messages/`.

## 📖 Documentation

Built-in documentation is available at `/docs` and includes:
- Architecture overview
- Installation guide
- API documentation
- Component library

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker
```bash
docker build -t better-saas .
docker run -p 3000:3000 better-saas
```

### Manual Deployment
```bash
pnpm build
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and checks
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the [documentation](/docs) for detailed guides
- Open an issue for bug reports or feature requests
- Join our community discussions

---

Built with ❤️ using the T3 Stack and modern web technologies.
