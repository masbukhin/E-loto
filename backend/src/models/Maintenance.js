const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  maintenanceCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true,
    index: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'emergency'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  damageDescription: {
    type: String,
    required: true
  },
  affectedUnits: [{
    type: String
  }],
  estimatedWorkTime: {
    type: Number, // hours
    required: true
  },
  estimatedCompletionDate: {
    type: Date,
    required: true
  },
  actualStartDate: Date,
  actualCompletionDate: Date,
  actualWorkTime: Number, // hours
  parts: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  laborCost: Number,
  totalCost: Number,
  notes: String,
  photos: [{
    url: String,
    caption: String,
    uploadedAt: Date
  }],
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  timeline: [{
    timestamp: Date,
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

maintenanceSchema.index({ machineId: 1, status: 1 });
maintenanceSchema.index({ reportedBy: 1, createdAt: -1 });

maintenanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
