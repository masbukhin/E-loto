const express = require('express');
const Machine = require('../models/Machine');
const Maintenance = require('../models/Maintenance');

const router = express.Router();

// Get all machines
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const machines = await Machine.find(query)
      .populate('assignedDevice', 'deviceId deviceName status')
      .populate('owner', 'username email firstName lastName')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Machine.countDocuments(query);

    res.json({
      data: machines,
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

// Get machine by ID
router.get('/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('assignedDevice')
      .populate('owner', 'username email firstName lastName')
      .populate('maintenanceInfo.maintenanceHistory');

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new machine
router.post('/', async (req, res) => {
  try {
    const {
      machineCode,
      machineName,
      machineType,
      serialNumber,
      rfidTag,
      owner,
      specifications,
      notes
    } = req.body;

    // Check if machine already exists
    const existingMachine = await Machine.findOne({ machineCode });
    if (existingMachine) {
      return res.status(400).json({ error: 'Machine code already exists' });
    }

    const machine = new Machine({
      machineCode,
      machineName,
      machineType,
      serialNumber,
      rfidTag,
      owner,
      specifications,
      notes,
      status: 'inactive',
      registrationStatus: 'not-registered'
    });

    await machine.save();

    res.status(201).json({
      message: 'Machine created successfully',
      machine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update machine
router.put('/:id', async (req, res) => {
  try {
    const { machineCode, machineName, status, assignedDevice, currentLocation, notes } = req.body;

    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      {
        machineCode,
        machineName,
        status,
        assignedDevice,
        currentLocation,
        notes,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('assignedDevice');

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json({
      message: 'Machine updated successfully',
      machine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register machine (change registration status)
router.put('/:id/register', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      {
        registrationStatus: 'registered',
        status: 'active'
      },
      { new: true }
    );

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json({
      message: 'Machine registered successfully',
      machine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get machine maintenance history
router.get('/:id/maintenance', async (req, res) => {
  try {
    const maintenance = await Maintenance.find({ machineId: req.params.id })
      .populate('reportedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
