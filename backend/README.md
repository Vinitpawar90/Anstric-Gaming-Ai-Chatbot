# 🧠 Anstric Gaming Backend

AI-Powered Internal Knowledge Platform - Transform scattered company documents into an intelligent assistant that answers employee questions, trains new hires, and provides insights into organizational knowledge.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Supabase)
- Redis (for queue management)

### Installation

1. **Clone and install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Set up database:**

   ```bash
   npm run migrate
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

Server will run at `http://localhost:8000`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── middlewares/       # Auth, validation, rate limiting
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic (AI, RAG, chat)
│   ├── database/          # DB schemas and migrations
│   ├── utils/             # Helper functions
│   └── dtos/              # Data transfer objects
├── docs/                  # API documentation
│   └── API_GUIDE.md       # Comprehensive API guide
├── scripts/               # Database and utility scripts
└── build/                 # Compiled output
```

---

## 🔐 Environment Variables

Key variables to configure in `.env`:

### Application
- `APP_NAME` - Application name (Anstric Gaming)
- `APP_URL` - Backend URL
- `PORT` - Server port (default: 8000)

### Security
- `JWT_SECRET` - Secret for JWT tokens (32+ characters)
- `ALLOWED_ORIGINS` - CORS allowed origins

### Database
- `DB_HOST` - PostgreSQL host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

### AI Services
- `GROQ_API_KEY` - Groq API key for LLM
- `PINECONE_API_KEY` - Pinecone for vector storage

### Redis (Queue Management)
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password

### File Storage (AWS S3 / Supabase)
- `AWS_ACCESS_KEY` - AWS access key
- `AWS_SECRET_KEY` - AWS secret key
- `AWS_BUCKET_NAME` - S3 bucket name
- `AWS_REGION` - AWS region
- `AWS_ENDPOINT` - S3 endpoint URL

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run test         # Run tests
```

### API Documentation


- OpenAPI JSON: `http://localhost:8000/api-docs.json`

---

## 📊 Database Architecture

### Core Tables

- **users** - User accounts and authentication
- **agents** - AI agent configurations
- **chat_sessions** - Conversation sessions
- **messages** - Individual chat messages
- **sources** - Knowledge sources (files, text, websites, Q&A)
- **provider_models** - Available AI models

### Source Types

- **file_sources** - Uploaded documents (PDF, DOCX, etc.)
- **text_sources** - Direct text input
- **website_sources** - Web scraped content
- **qa_sources** - Question/Answer pairs
- **database_sources** - Database connections

---

## 🔌 API Endpoints

### Authentication (Public)

- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login

### Chat (Protected)

- `POST /api/v1/chat` - Send message and get AI response
- `GET /api/v1/chat/sessions` - Get user's chat sessions
- `GET /api/v1/chat/sessions/:id` - Get session messages

### Knowledge Management (Protected)

- `POST /api/v1/sources/upload` - Upload document
- `POST /api/v1/sources/text` - Add text source
- `POST /api/v1/sources/website` - Add website source
- `GET /api/v1/sources` - List all sources

### System

- `GET /health` - Health check endpoint


---

## 🛡️ Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Environment variable validation
- ✅ Encrypted API key storage

---

## 🧠 AI & RAG Pipeline

### Vector Database (Pinecone)

Anstric Gaming uses Pinecone for semantic search:

1. Documents are chunked and embedded
2. Embeddings stored in Pinecone index
3. User questions are embedded
4. Similar content retrieved via vector search
5. Context passed to LLM for response generation

### Supported AI Providers

- **Groq** - Fast inference (default)
- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **Google** - Gemini models

---

## 📝 Logging

Logs are written to `logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only
- Logs rotate daily

---

## 🧪 Testing

```bash
npm run test
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint:fix`
4. Run tests: `npm run test`
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👤 Author

**Harshal Patil**

---

## 📚 Additional Resources

- [Project Vision](../project.md)
- [Frontend Documentation](../frontend/README.md)
- [API Documentation](http://localhost:8000/api-docs) (when running)
