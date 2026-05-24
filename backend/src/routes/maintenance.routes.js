const express = require('express');
const Maintenance = require('../models/Maintenance');
const Machine = require('../models/Machine');

const router = express.Router();

// Get all maintenance requests
router.get('/', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    const maintenanceRequests = await Maintenance.find(query)
      .populate('machineId', 'machineCode machineName')
      .populate('reportedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Maintenance.countDocuments(query);

    res.json({
      data: maintenanceRequests,
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

// Get maintenance by ID
router.get('/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('machineId')
      .populate('reportedBy', 'username email firstName lastName')
      .populate('assignedTo', 'username email firstName lastName')
      .populate('timeline.updatedBy', 'username firstName lastName');

    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance request
router.post('/', async (req, res) => {
  try {
    const {
      machineId,
      reportedBy,
      type,
      priority,
      damageDescription,
      affectedUnits,
      estimatedWorkTime,
      notes
    } = req.body;

    // Generate maintenance code
    const timestamp = Date.now().toString().slice(-8);
    const maintenanceCode = `MAINT-${timestamp}`;

    // Calculate estimated completion date
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setHours(
      estimatedCompletionDate.getHours() + estimatedWorkTime
    );

    const maintenance = new Maintenance({
      maintenanceCode,
      machineId,
      reportedBy,
      type: type || 'corrective',
      priority: priority || 'medium',
      status: 'pending',
      damageDescription,
      affectedUnits: affectedUnits || [],
      estimatedWorkTime,
      estimatedCompletionDate,
      notes,
      timeline: [{
        timestamp: Date.now(),
        status: 'pending',
        updatedBy: reportedBy,
        comment: 'Maintenance request created'
      }]
    });

    await maintenance.save();

    // Update machine status
    await Machine.findByIdAndUpdate(machineId, { status: 'maintenance' });

    res.status(201).json({
      message: 'Maintenance request created successfully',
      maintenance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update maintenance status
router.put('/:id', async (req, res) => {
  try {
    const { status, assignedTo, notes, actualWorkTime, totalCost } = req.body;

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    // Update fields
    if (status) maintenance.status = status;
    if (assignedTo) maintenance.assignedTo = assignedTo;
    if (notes) maintenance.notes = notes;
    if (actualWorkTime) maintenance.actualWorkTime = actualWorkTime;
    if (totalCost) maintenance.totalCost = totalCost;

    // Add timeline entry
    maintenance.timeline.push({
      timestamp: Date.now(),
      status: status || maintenance.status,
      comment: notes || 'Status updated'
    });

    // If completed, update machine status
    if (status === 'completed') {
      maintenance.actualCompletionDate = Date.now();
      await Machine.findByIdAndUpdate(maintenance.machineId, { status: 'active' });
    }

    if (status === 'in-progress') {
      maintenance.actualStartDate = Date.now();
    }

    await maintenance.save();

    res.json({
      message: 'Maintenance request updated successfully',
      maintenance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign maintenance to technician
router.put('/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo,
        status: 'in-progress'
      },
      { new: true }
    ).populate('assignedTo', 'username email firstName lastName');

    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    res.json({
      message: 'Maintenance assigned successfully',
      maintenance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload maintenance photos
router.post('/:id/photos', async (req, res) => {
  try {
    const { url, caption } = req.body;

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          photos: {
            url,
            caption,
            uploadedAt: Date.now()
          }
        }
      },
      { new: true }
    );

    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    res.json({
      message: 'Photo uploaded successfully',
      maintenance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
