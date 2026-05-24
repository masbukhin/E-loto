const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['ESP32', 'RFID_READER', 'GPS_TRACKER'],
    default: 'ESP32'
  },
  ipAddress: {
    type: String,
    required: true
  },
  macAddress: {
    type: String
  },
  firmwareVersion: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'offline', 'error'],
    default: 'offline'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  lastLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  currentMachineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  rfidReader: {
    enabled: Boolean,
    apiEndpoint: String,
    lastRead: Date,
    lastReadTag: String
  },
  gpsModule: {
    enabled: Boolean,
    updateInterval: Number, // in milliseconds
    lastUpdate: Date
  },
  battery: {
    level: Number, // 0-100
    voltage: Number,
    lastUpdate: Date
  },
  signalStrength: {
    type: Number,
    min: -120,
    max: 0 // dBm
  },
  connectivity: {
    wifi: {
      ssid: String,
      signal: Number,
      connected: Boolean
    },
    cellular: {
      signal: Number,
      connected: Boolean
    }
  },
  heartbeat: {
    lastSeen: Date,
    interval: Number // expected heartbeat interval in seconds
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for geospatial queries
deviceSchema.index({ 'location': '2dsphere' });

// Update updatedAt before saving
deviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Device', deviceSchema);
