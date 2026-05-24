const express = require('express');
const Machine = require('../models/Machine');
const Device = require('../models/Device');

const router = express.Router();

// Get all active boxes with GPS location
router.get('/boxes', async (req, res) => {
  try {
    const machines = await Machine.find({ status: 'active' })
      .populate('assignedDevice', 'deviceId deviceName ipAddress status lastLocation')
      .select('machineCode machineName rfidTag status currentLocation assignedDevice createdAt');

    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get box details with full information
router.get('/boxes/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('assignedDevice')
      .populate('owner', 'username email firstName lastName');

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get box location history/movement tracking
router.get('/boxes/:id/history', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    const device = await Device.findById(machine.assignedDevice)
      .select('lastLocation')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      machineId: machine._id,
      machineName: machine.machineName,
      currentLocation: machine.currentLocation,
      history: device || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby boxes (geospatial query)
router.get('/boxes/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { distance = 5000 } = req.query; // distance in meters

    const machines = await Machine.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(distance)
        }
      }
    })
    .populate('assignedDevice', 'deviceId deviceName status')
    .limit(50);

    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalMachines = await Machine.countDocuments();
    const activeMachines = await Machine.countDocuments({ status: 'active' });
    const inactiveMachines = await Machine.countDocuments({ status: 'inactive' });
    const maintenanceMachines = await Machine.countDocuments({ status: 'maintenance' });

    const activeDevices = await Device.countDocuments({ status: 'active' });
    const offlineDevices = await Device.countDocuments({ status: 'offline' });

    res.json({
      machines: {
        total: totalMachines,
        active: activeMachines,
        inactive: inactiveMachines,
        maintenance: maintenanceMachines
      },
      devices: {
        active: activeDevices,
        offline: offlineDevices
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time box status (WebSocket-like data)
router.get('/boxes/:id/realtime', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('assignedDevice');

    if (!machine || !machine.assignedDevice) {
      return res.status(404).json({ error: 'Machine or device not found' });
    }

    const device = machine.assignedDevice;

    res.json({
      machineId: machine._id,
      machineName: machine.machineName,
      status: machine.status,
      registrationStatus: machine.registrationStatus,
      currentLocation: {
        latitude: device.lastLocation?.latitude,
        longitude: device.lastLocation?.longitude,
        accuracy: device.lastLocation?.accuracy,
        timestamp: device.lastLocation?.timestamp
      },
      device: {
        deviceId: device.deviceId,
        status: device.status,
        battery: device.battery?.level,
        signalStrength: device.signalStrength
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
