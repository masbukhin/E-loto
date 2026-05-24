# Backend API - E-Loto System

Node.js/Express API Server untuk E-Loto IoT Management System.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env dengan konfigurasi lokal Anda
npm start
```

## Environment Variables

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/eloto
JWT_SECRET=your-secret-key
RFID_API_KEY=your-rfid-api-key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Dashboard
- `GET /api/dashboard/boxes` - Get active boxes with GPS
- `GET /api/dashboard/boxes/:id` - Get box details
- `GET /api/dashboard/boxes/:id/history` - Get box movement history

### Machines/Units
- `GET /api/machines` - List all machines
- `POST /api/machines` - Create new machine
- `PUT /api/machines/:id` - Update machine info
- `GET /api/machines/:id/maintenance` - Get maintenance history

### Maintenance
- `POST /api/maintenance/register` - Register maintenance request
- `GET /api/maintenance/requests` - Get all maintenance requests
- `PUT /api/maintenance/:id` - Update maintenance status
- `GET /api/maintenance/:id` - Get maintenance details

### IoT Device
- `POST /api/device/register` - Register new ESP32 device
- `POST /api/device/:id/location` - Update GPS location
- `POST /api/device/:id/rfid` - Process RFID reading
- `GET /api/device/:id/status` - Get device status
