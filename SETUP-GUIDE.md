# Backend Setup Guide

## Problem
Backend se data nahi aa raha because MongoDB running nahi hai.

## Solutions

### Option 1: Local MongoDB Start Karo

1. **MongoDB Service Start:**
   ```bash
   # PowerShell as Administrator run karo
   net start MongoDB
   ```

2. **Ya manually start karo:**
   ```bash
   # MongoDB bin folder mein jao
   cd "C:\Program Files\MongoDB\Server\7.0\bin"
   
   # MongoDB start karo
   mongod --dbpath "C:\data\db"
   ```

### Option 2: MongoDB Atlas Use Karo (Recommended - Free & Easy)

1. **MongoDB Atlas account banao:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Free tier select karo

2. **Cluster banao:**
   - Create a free M0 cluster
   - Choose closest region (e.g., Mumbai)

3. **Database User banao:**
   - Database Access → Add New Database User
   - Username aur password set karo
   - Built-in Role: "Read and write to any database"

4. **Network Access allow karo:**
   - Network Access → Add IP Address
   - "Allow Access from Anywhere" (0.0.0.0/0) select karo

5. **Connection String copy karo:**
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecom?retryWrites=true&w=majority`

6. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/ecom?retryWrites=true&w=majority
   ```

### Option 3: Install MongoDB Locally (If not installed)

1. Download: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB Compass bhi install hoga (GUI tool)
4. Service automatically start hogi

## After MongoDB is Running

1. **Backend start karo:**
   ```bash
   npm run dev:api
   ```

2. **Frontend start karo (separate terminal):**
   ```bash
   npm run dev:web
   ```

3. **Ya dono ek saath:**
   ```bash
   npm run dev
   ```

## Verify Connection

1. Backend running: http://localhost:4000/api
2. Frontend running: http://localhost:3000
3. Test page: http://localhost:3000/test-connection

## Common Issues

### "Failed to fetch"
- Backend running nahi hai
- MongoDB connected nahi hai
- Port 4000 already in use

### "MongooseServerSelectionError"
- MongoDB running nahi hai
- Connection string galat hai
- Network access blocked hai (Atlas)

### Port already in use
```bash
# Port 4000 ko free karo
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F
```
