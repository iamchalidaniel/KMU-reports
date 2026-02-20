import express from 'express';
import StudentReport from '../models/studentReport.js';
import CaseModel from '../models/case.js';
import StudentModel from '../models/student.js';

const router = express.Router();

// Public homepage data endpoint
router.get('/homepage', async (req, res) => {
  try {
    // Statistics removed for simplified public view
    
    // Recent cases removed for security - only authenticated staff should view case details
    
    // Get case statistics by severity (removed for public view)
    const severityStats = [];
    
    res.json({
      message: "Welcome to KMU Reports"
      // All stats and case data removed for security
    });
  } catch (error) {
    console.error('Public homepage error:', error);
    res.status(500).json({ error: 'Failed to load homepage data' });
  }
});

// Public anonymous report submission
router.post('/anonymous-report', async (req, res) => {
  try {
    const { 
      incident_date, 
      description, 
      offense_type, 
      severity,
      reporter_name,
      reporter_contact
    } = req.body;

    // Validation
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Description is required and must be at least 10 characters' 
      });
    }

    if (!offense_type) {
      return res.status(400).json({ 
        error: 'Offense type is required' 
      });
    }

    const validSeverities = ['Low', 'Medium', 'High'];
    if (severity && !validSeverities.includes(severity)) {
      return res.status(400).json({ 
        error: 'Invalid severity level. Must be Low, Medium, or High' 
      });
    }

    if (incident_date) {
      const date = new Date(incident_date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid incident date format' 
        });
      }
      // Don't allow future dates
      if (date > new Date()) {
        return res.status(400).json({ 
          error: 'Incident date cannot be in the future' 
        });
      }
    }

    // Create anonymous report
    const report = new StudentReport({
      student_id: null, // Anonymous - no student ID
      student_name: reporter_name || 'Anonymous Reporter',
      student_email: reporter_contact || null,
      incident_date: incident_date || new Date(),
      description: description.trim(),
      offense_type: offense_type,
      severity: severity || 'Medium',
      status: 'Pending',
      is_anonymous: true,
      admin_comments: 'Submitted anonymously via public report form'
    });

    await report.save();
    
    res.status(201).json({
      message: 'Anonymous report submitted successfully. Thank you for your report.',
      reportId: report._id
    });
  } catch (error) {
    console.error('Anonymous report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get public report status (by ID)
router.get('/report-status/:id', async (req, res) => {
  try {
    const report = await StudentReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only return limited info for anonymous reports
    if (report.is_anonymous) {
      res.json({
        status: report.status,
        submitted_date: report.created_at,
        offense_type: report.offense_type,
        severity: report.severity
      });
    } else {
      res.json({
        status: report.status,
        submitted_date: report.created_at,
        offense_type: report.offense_type,
        severity: report.severity,
        student_name: report.student_name
      });
    }
  } catch (error) {
    console.error('Report status error:', error);
    res.status(500).json({ error: 'Failed to retrieve report status' });
  }
});

export default router;