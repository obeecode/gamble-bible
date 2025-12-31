# Gamble Bible

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install:all
   ```

### Development

Start both frontend and backend:
```bash
npm run dev
```

Or start individually:
```bash
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:4000
```

### Production

Build the application:
```bash
npm run build
```

Start production server:
```bash
npm run start
```

## Environment Variables

Copy `.env.example` to `.env` in the backend directory and update the values.
