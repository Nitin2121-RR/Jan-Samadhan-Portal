# Jan-Samadhan - Grievance Management System

A comprehensive digital platform for citizen grievance management with blockchain verification, AI-powered categorization, and real-time tracking.

## 🚀 Quick Deploy

### Frontend (Vercel)
1. Connect this repo to Vercel
2. Set Root Directory: `./` (project root)
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

### Backend (Railway)
1. Create new Railway service from GitHub
2. Set Root Directory: `backend`
3. Environment Variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   JWT_SECRET=your_secret_here
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

### Database (Railway PostgreSQL)
1. Create PostgreSQL service in Railway
2. Copy DATABASE_URL to backend environment
3. Deploy backend (migrations run automatically)

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM + TypeScript
- **Database**: PostgreSQL with comprehensive schema
- **Blockchain**: Ethereum smart contracts (Sepolia testnet)
- **AI**: Google Gemini for categorization and analysis
- **Real-time**: Socket.io for live updates
- **PWA**: Service worker + manifest for mobile app experience

## 🔑 Features

### For Citizens
- File grievances with location and file attachments
- Track grievance status in real-time
- Community feed to see public grievances
- Upvote important issues
- Multi-language support
- PWA installation for mobile experience

### For Authorities
- Department-based grievance assignment
- Priority scoring and escalation
- Bulk operations and filtering
- Performance analytics
- Blockchain verification
- AI-assisted categorization

### Technical Features
- Blockchain transparency and immutability
- AI-powered duplicate detection
- Vector embeddings for similarity matching
- Real-time notifications
- File upload with security scanning
- Responsive design for all devices

## 🧪 Test Accounts

**Citizen**: citizen@test.com / Test@123
**Authorities**: 
- gro.health@test.com / Test@123 (Health Department)
- gro.pwd@test.com / Test@123 (Public Works)
- director.dc@test.com / Test@123 (District Director)

## 📱 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + Radix UI components
- React Hook Form for forms
- Socket.io client for real-time updates
- Leaflet for maps
- Ethers.js for blockchain interaction

### Backend
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication
- Socket.io for WebSocket connections
- Multer for file uploads
- Google Generative AI integration
- Ethers.js for smart contract interaction

### Blockchain
- Solidity smart contracts
- Hardhat development framework
- OpenZeppelin security standards
- Sepolia testnet deployment
- Event-based notifications

## 🔧 Local Development

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../contracts && npm install --legacy-peer-deps

# Setup database (PostgreSQL)
cd backend
npx prisma migrate dev
npx prisma db seed

# Start services
npm run dev  # Frontend (port 3000)
cd backend && npm run dev  # Backend (port 5001)
```

## 🌐 Deployment URLs

- **Frontend**: https://jan-samadhan.vercel.app
- **Backend**: https://jan-samadhan-backend.railway.app
- **Smart Contracts**: Deployed on Sepolia testnet

## 📄 License

MIT License - Built for hackathon demonstration

---

**Jan-Samadhan** - Empowering citizens through transparent and efficient grievance management.