# Votez - Real-Time Polling Platform

A modern, real-time polling platform that allows users to create polls, vote, and see results update instantly across all connected users.

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Votez
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Update environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
   ```

4. **Start with Docker Compose:**
   ```bash
   docker-compose up
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend URLs
   ```

3. **Generate environment config:**
   ```bash
   npm run generate:env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized setup)
- Backend API running (FastAPI)

## 🎯 Features

### Core Functionality
- **Poll Creation**: Create polls with 2-10 customizable options
- **Real-Time Voting**: Vote on polls with instant feedback and result updates
- **Like System**: Like/unlike polls with live counter updates
- **Live Updates**: WebSocket integration ensures all interactions update in real-time
- **Visual Results**: Animated percentage bars and vote counts for each option
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Authentication**: User registration and login system

### Technical Highlights
- **Real-time Communication**: WebSocket implementation for live updates
- **Type Safety**: Full TypeScript implementation throughout frontend
- **Modern UI**: Clean, accessible interface using shadcn/ui components
- **Centralized Constants**: All configuration in dedicated files
- **Clean Architecture**: Separated helpers, interfaces, and components

## 🛠️ Technology Stack

### Frontend
- **Next.js 13** - React framework with App Router
- **React 18** - UI component library
- **TypeScript** - Type-safe development
- **shadcn/ui** - Modern, accessible component library
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

## 📁 Project Structure

```
Votez/
├── app/                          # Next.js app directory
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── auth-modal.tsx           # Authentication modal
│   ├── poll-card.tsx            # Poll display component
│   ├── create-poll-form.tsx     # Poll creation form
│   ├── edit-poll-modal.tsx      # Poll editing modal
│   ├── helper/                  # Component helpers
│   ├── interfaces/              # Component interfaces
│   └── ui/                      # UI components
├── lib/                         # Utilities
│   ├── api.ts                   # API client
│   ├── auth-store.tsx           # Authentication context
│   ├── websocket.ts             # WebSocket manager
│   ├── token-utils.ts           # Token utilities
│   └── utils.ts                 # General utilities
├── application-shared/          # Shared resources
│   ├── constants/               # Constants
│   │   ├── regex-constants.ts
│   │   ├── toaster-constants.ts
│   │   ├── validator-constants.ts
│   │   └── websocket-constants.ts
│   └── interfaces/              # Shared interfaces
│       ├── auth-interfaces.ts
│       ├── polls-interface.ts
│       ├── shared-interfaces.ts
│       └── user-interfaces.ts
├── Dockerfile                    # Docker configuration
├── docker-compose.yml           # Docker Compose setup
└── vercel.json                  # Vercel configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run generate:env` - Generate environment config

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com/ws
```

## 🚀 Deployment

### Deploying to Vercel

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository

3. **Add environment variables:**
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
   - `NEXT_PUBLIC_WS_URL` - Your WebSocket URL

4. **Deploy:**
   - Click "Deploy"
   - Your app is live!

### Deploying with Docker

```bash
# Build the image
docker build -t votez-app .

# Run the container
docker run -p 3000:3000 --env-file .env.local votez-app
```

### Other Platforms

- **Netlify**: Auto-detects Next.js
- **AWS Amplify**: Supports Next.js out of the box
- **Railway**: Container-based deployment
- **Render**: Easy web service deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔌 API Integration

This frontend requires a backend API. Ensure your backend is:
- Running on the configured port
- Providing the required endpoints
- Handling WebSocket connections for real-time updates

Required endpoints:
- `GET /api/polls` - Fetch polls
- `POST /api/polls` - Create poll
- `POST /api/polls/{id}/vote` - Vote on poll
- `POST /api/polls/{id}/like` - Like poll
- `PUT /api/polls/{id}` - Update poll
- `DELETE /api/polls/{id}` - Delete poll
- `WS /ws` - WebSocket for real-time updates

## 🧪 Testing

### Manual Testing

1. **Create a Poll:**
   - Click "Create New Poll"
   - Enter title and options
   - Submit

2. **Vote:**
   - Click any option
   - See results update
   - Vote only once per poll

3. **Real-time Updates:**
   - Open app in multiple windows
   - Create/vote in one window
   - See updates in all windows


## 🐛 Troubleshooting

### Port Already in Use

```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Environment Variables Not Working

1. Create `.env.local` file
2. Run `npm run generate:env`
3. Restart development server

### WebSocket Connection Failed

- Check backend is running
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Use `wss://` for production (not `ws://`)

### Docker Issues

```bash
# Clean Docker containers
docker-compose down -v

# Rebuild
docker-compose up --build
```


Built with ❤️ by M3BIONIX
