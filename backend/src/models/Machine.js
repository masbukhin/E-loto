const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  machineName: {
    type: String,
    required: true
  },
  machineType: {
    type: String,
    required: true,
    enum: ['BOX', 'UNIT', 'CONTAINER']
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  rfidTag: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'retired'],
    default: 'inactive'
  },
  registrationStatus: {
    type: String,
    enum: ['not-registered', 'pending', 'registered'],
    default: 'not-registered'
  },
  assignedDevice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    default: null
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
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    accuracy: Number,
    lastUpdate: Date
  },
  specifications: {
    weight: Number, // kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    capacity: Number,
    materialType: String
  },
  maintenanceInfo: {
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceInterval: Number, // days
    maintenanceHistory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Maintenance'
    }]
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index untuk geospatial queries
machineSchema.index({ 'location': '2dsphere' });

machineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Machine', machineSchema);
