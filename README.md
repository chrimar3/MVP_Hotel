# Hotel Review Generator MVP

AI-powered hotel review generator with LLM integration and template fallback system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Features

- 🤖 AI-powered review generation (OpenAI/Groq)
- 🔄 Template fallback system
- 🌍 Multi-language support (15+ languages)
- 📱 Mobile-first responsive design
- ⚡ <100ms generation time
- 🔒 Secure API proxy

## Architecture

- **Frontend**: Vanilla JavaScript (zero dependencies)
- **AI Services**: OpenAI GPT + Groq with intelligent fallback
- **Security**: Server-side API key management
- **Structure**: Clean monorepo with npm workspaces

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Code linting
make setup           # Full environment setup
```

## Project Structure

```
apps/web/            # Main application
packages/core/       # Business logic
packages/ui/         # UI components
packages/utils/      # Shared utilities
api/                 # Server-side API
```

## License

MIT