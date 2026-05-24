const express = require('express');
const Device = require('../models/Device');
const Machine = require('../models/Machine');

const router = express.Router();

// Register new ESP32 device
router.post('/register', async (req, res) => {
  try {
    const {
      deviceId,
      deviceName,
      ipAddress,
      macAddress,
      firmwareVersion
    } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({ error: 'Device ID already registered' });
    }

    const device = new Device({
      deviceId,
      deviceName,
      ipAddress,
      macAddress,
      firmwareVersion,
      status: 'offline',
      rfidReader: { enabled: true },
      gpsModule: { enabled: true, updateInterval: 10000 }
    });

    await device.save();

    res.status(201).json({
      message: 'Device registered successfully',
      device
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device status
router.get('/:id/status', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .select('deviceId status battery signalStrength lastLocation heartbeat connectivity');

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update GPS location from ESP32
router.post('/:id/location', async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        lastLocation: {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now()
        },
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        status: 'active'
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Update associated machine location
    if (device.currentMachineId) {
      await Machine.findByIdAndUpdate(device.currentMachineId, {
        currentLocation: {
          latitude,
          longitude,
          accuracy,
          lastUpdate: Date.now()
        },
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      });
    }

    res.json({
      message: 'Location updated successfully',
      device
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process RFID reading
router.post('/:id/rfid', async (req, res) => {
  try {
    const { rfidTag, timestamp } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        'rfidReader.lastRead': timestamp || Date.now(),
        'rfidReader.lastReadTag': rfidTag
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Find machine by RFID tag
    const machine = await Machine.findOne({ rfidTag });

    res.json({
      message: 'RFID processed successfully',
      device,
      machine: machine ? {
        id: machine._id,
        machineCode: machine.machineCode,
        machineName: machine.machineName,
        registrationStatus: machine.registrationStatus
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update device battery status
router.post('/:id/battery', async (req, res) => {
  try {
    const { level, voltage } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        'battery.level': level,
        'battery.voltage': voltage,
        'battery.lastUpdate': Date.now()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device heartbeat
router.post('/:id/heartbeat', async (req, res) => {
  try {
    const { signalStrength, connectivity } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        'heartbeat.lastSeen': Date.now(),
        signalStrength,
        connectivity,
        status: 'active'
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ message: 'Heartbeat received', device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link device to machine
router.post('/:id/link-machine', async (req, res) => {
  try {
    const { machineId } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { currentMachineId: machineId },
      { new: true }
    ).populate('currentMachineId');

    const machine = await Machine.findByIdAndUpdate(
      machineId,
      { assignedDevice: req.params.id },
      { new: true }
    );

    res.json({
      message: 'Device linked to machine successfully',
      device,
      machine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all devices
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const devices = await Device.find(query)
      .populate('currentMachineId', 'machineCode machineName')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Device.countDocuments(query);

    res.json({
      data: devices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
