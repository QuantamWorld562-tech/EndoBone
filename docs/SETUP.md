# EndoBone AI Frontend - Setup & Installation Guide

## 📋 System Requirements

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher (or yarn 3.x+)
- **Git**: For version control
- **Docker** (optional): For containerized deployment
- **RAM**: Minimum 4GB recommended
- **Disk**: 2GB available space

## 🚀 Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/endobone/ai-frontend.git
cd endobone-ai-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📦 Detailed Setup Process

### Step 1: Prerequisites Installation

#### macOS
```bash
# Install Node.js via Homebrew
brew install node

# Verify installation
node --version
npm --version
```

#### Windows
```bash
# Using Chocolatey
choco install nodejs

# Or download from https://nodejs.org/
```

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm
```

### Step 2: Project Setup

```bash
# Clone the repository
git clone https://github.com/endobone/ai-frontend.git
cd endobone-ai-frontend

# Install dependencies
npm install

# Verify installation
npm list react lucide-react
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment file
nano .env.local  # or your preferred editor
```

**Key environment variables:**
```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_MOCK_DATA=true
```

#### Backend environment

The backend uses a separate root `.env` file:

```bash
cp .env.example .env
```

Set `MONGODB_URI`, `GEMINI_API_KEY`, and optionally `PORT`, `GEMINI_MODEL`, and `FRONTEND_ORIGINS`. Start MongoDB, then run the API in a second terminal:

```bash
npm run server:dev
```

The API listens on `http://localhost:4000`; the Vite proxy exposes it to the frontend under `/api`.

### Step 4: Tailwind CSS Setup

Already configured in the project. To verify:

```bash
# Check tailwind.config.js exists
ls -la tailwind.config.js

# Check postcss.config.js exists
ls -la postcss.config.js
```

### Step 5: Verify Installation

```bash
# Test build
npm run build

# Verify build output
ls -la build/

# Start development server
npm run dev
```

---

## 🖥️ Running the Application

### Development Mode
```bash
npm run dev
```
- **URL**: http://localhost:5173
- **Features**: Hot reload, source maps, debug tools
- **Performance**: Not optimized (for development speed)

### Production Build
```bash
npm run build
npm run serve
```
- **URL**: http://localhost:3000
- **Features**: Optimized, minified, compressed
- **Performance**: Production-ready

### With Mock Data
The application comes with pre-loaded mock data for testing:
```bash
# Already enabled in .env.local by default
REACT_APP_ENABLE_MOCK_DATA=true
```

Sample patient IDs: `PEB-8842-A`, `PEB-8841-B`, `PEB-8840-C`

---

## 🐳 Docker Setup

### Build Docker Image
```bash
npm run docker:build
# or
docker build -t endobone-ai:latest .
```

### Run Docker Container
```bash
npm run docker:run
# or
docker run -p 3000:3000 endobone-ai:latest
```

### Using Docker Compose (Recommended for Development)
```bash
# Start all services (frontend, mock API, nginx)
npm run compose:up

# View logs
npm run compose:logs

# Stop services
npm run compose:down
```

**Services started:**
- **Frontend**: http://localhost:3000
- **Mock API**: http://localhost:4000
- **Nginx proxy**: http://localhost (redirects to frontend)

---

## 🧪 Testing

### Backend API tests

```bash
npm run server:test
```

These tests validate routing, request validation, and the Gemini few-shot contract without requiring a live MongoDB or Gemini request.

### Unit Tests
```bash
npm test

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### E2E Tests (Playwright)
```bash
# Run tests
npm run e2e

# Interactive UI
npm run e2e:ui
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

---

## 🔧 Configuration Files

### `vite.config.js`
React/Vite build configuration

### `tailwind.config.js`
Tailwind CSS theme and plugin configuration

### `postcss.config.js`
PostCSS processor configuration for Tailwind

### `.env.local`
Local environment variables (git-ignored)

### `vercel.json`
Vercel deployment configuration

### `Dockerfile`
Container image definition

---

## 📂 Project Structure

```
endobone-ai-frontend/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── EndoBoneAI.jsx          # Main component
│   │   ├── Dashboard/
│   │   ├── Assessment/
│   │   ├── Planning/
│   │   ├── Surgery/
│   │   └── Common/
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── services/                   # API services
│   │   ├── data/                       # Mock data
│   │   ├── styles/
│   │   │   └── index.css               # Global styles + Tailwind
│   │   └── App.jsx                     # Root component
│   ├── public/                         # Static assets and 3D models
│   └── index.html                      # Vite HTML template
├── package.json                    # Dependencies & scripts
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── Dockerfile                      # Container image
├── docker-compose.yml              # Multi-container setup
├── .env.example                    # Environment template
└── README.md                        # Documentation
```

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel deploy
```

**Configuration**: Automatically uses `vercel.json`

### Docker Deployment

```bash
# Build image
docker build -t endobone-ai:1.0.0 .

# Push to registry
docker tag endobone-ai:1.0.0 your-registry/endobone-ai:1.0.0
docker push your-registry/endobone-ai:1.0.0

# Deploy using kubernetes or docker run
```

### Self-Hosted (VPS/Server)

```bash
# SSH to server
ssh user@your-server.com

# Clone repo
git clone https://github.com/endobone/ai-frontend.git
cd endobone-ai-frontend

# Install and build
npm install
npm run build

# Start with PM2 (process manager)
npm install -g pm2
pm2 start "npm run serve" --name "endobone"
pm2 save
```

---

## 🔒 Security Checklist

- [ ] Update all dependencies: `npm audit fix`
- [ ] Set `REACT_APP_HTTPS_ONLY=true` in production
- [ ] Enable CSP headers in server configuration
- [ ] Use HTTPS certificates (Let's Encrypt for self-hosted)
- [ ] Implement authentication (OAuth2/JWT)
- [ ] Configure CORS properly
- [ ] Sanitize user inputs
- [ ] Regular security audits: `npm audit`
- [ ] Keep Node.js and dependencies updated
- [ ] Use environment variables for sensitive data

---

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 5173 already in use

**Solution:**
```bash
# Use different port
npm run dev -- --port 3001

# Or kill process using port
# macOS/Linux
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: Styles not loading

**Solution:**
```bash
# Rebuild Tailwind
npm run build

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)

# Check tailwind.config.js content paths are correct
```

### Issue: Mock data not showing

**Solution:**
```bash
# Verify mock data is enabled
grep "REACT_APP_ENABLE_MOCK_DATA" .env.local
# Should output: REACT_APP_ENABLE_MOCK_DATA=true

# Restart dev server
npm run dev
```

### Issue: API calls failing

**Solution:**
```bash
# Check API URL configuration
grep "REACT_APP_API_URL" .env.local

# Verify API server is running
curl http://localhost:4000/api/health

# Start mock API with docker-compose
npm run compose:up
```

---

## 📊 Performance Optimization

### Build Analysis
```bash
npm run analyze
```

### Lighthouse Testing
```bash
# Using Chrome DevTools
# Open DevTools (F12) → Lighthouse → Analyze page load
```

### Bundle Optimization Tips
- Use code splitting for large components
- Lazy load heavy dependencies
- Optimize images (WebP format)
- Enable gzip compression in server
- Use CDN for static assets

---

## 🆘 Getting Help

### Documentation
- API Docs: `/docs/api`
- Component Guide: Storybook (`npm run storybook`)
- Clinical Guidelines: `/docs/guidelines`

### Support Channels
- GitHub Issues: [endobone/ai-frontend/issues](https://github.com/endobone/ai-frontend/issues)
- Email: support@endobone.ai
- Slack: #endobone-dev

### Common Documentation
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [Vite Guide](https://vitejs.dev/guide/)

---

## ✅ Post-Setup Verification

Run this checklist to ensure everything is working:

```bash
# 1. Check Node.js version
node --version  # Should be 16.x or higher

# 2. Check npm version
npm --version   # Should be 8.x or higher

# 3. Check dependencies installed
npm list react lucide-react

# 4. Build project
npm run build   # Should complete without errors

# 5. Start dev server
npm run dev     # Should start on http://localhost:5173

# 6. Test in browser
# - Landing page loads
# - Navigation works
# - Mock data displays
# - No console errors
```

---

## 📝 Version History

- **v1.0.0** - Initial setup and deployment configuration
- **Future**: CI/CD pipeline, automated testing, performance monitoring

---

**Last Updated**: August 15, 2026
**Status**: Ready for Development
