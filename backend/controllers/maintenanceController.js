import MaintenanceReportModel from '../models/maintenanceReport.js';

export async function listMaintenanceReports(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const status = req.query.status;
        const priority = req.query.priority;
        const category = req.query.category;
        const hall = req.query.hall;
        
        const query = { report_type: 'maintenance' }; // Only maintenance reports
        
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (hall) query['location.hall'] = hall;
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { 'location.room': { $regex: search, $options: 'i' } },
                { 'reported_by.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by student if user is a student (only see their own reports)
        if (req.user.role === 'student') {
            query['reported_by.student_id'] = req.user.studentId || req.user.id;
        }
        
        // Filter by assigned staff if user is electrician (only see assigned reports)
        if (req.user.role === 'electrician') {
            query['assigned_to.staff_id'] = req.user.id || req.user._id;
        }

        const total = await MaintenanceReportModel.countDocuments(query);
        const reports = await MaintenanceReportModel.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error listing maintenance reports:', err);
        res.status(500).json({ error: 'Failed to list maintenance reports' });
    }
}

export async function getMaintenanceReport(req, res) {
    try {
        const { id } = req.params;
        let report;
        
        if (dbType === 'mongo') {
            report = await MaintenanceReportModel.findOne({ 
                _id: id, 
                report_type: 'maintenance' 
            });
            if (!report) {
                return res.status(404).json({ error: 'Maintenance report not found' });
            }
        } else if (dbType === 'mysql') {
            const [rows] = await db.execute(
                'SELECT * FROM maintenance_reports WHERE id = ? AND report_type = "maintenance"',
                [id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Maintenance report not found' });
            }
            report = rows[0];
        }

        res.json(report);
    } catch (err) {
        console.error('Error getting maintenance report:', err);
        res.status(500).json({ error: 'Failed to get maintenance report' });
    }
}

export async function createMaintenanceReport(req, res) {
    try {
        // Ensure report_type is set to maintenance
        const reportData = {
            ...req.body,
            report_type: 'maintenance',
            created_by: req.user.id || req.user.username || req.user.studentId,
            created_at: new Date(),
            updated_at: new Date()
        };

        // If student is submitting, ensure reported_by is set correctly
        if (req.user.role === 'student') {
            reportData.reported_by = {
                ...reportData.reported_by,
                student_id: req.user.studentId || req.user.id,
                name: reportData.reported_by?.name || req.user.name || req.user.username || 'Anonymous',
                contact: reportData.reported_by?.contact || req.user.email || undefined
            };
        }

        const report = new MaintenanceReportModel(reportData);
        await report.save();

        res.status(201).json(report);
    } catch (err) {
        console.error('Error creating maintenance report:', err);
        res.status(500).json({ error: 'Failed to create maintenance report' });
    }
}

export async function updateMaintenanceReport(req, res) {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        let report;
        if (dbType === 'mongo') {
            report = await MaintenanceReportModel.findOneAndUpdate(
                { _id: id, report_type: 'maintenance' },
                updateData,
                { new: true }
            );
            if (!report) {
                return res.status(404).json({ error: 'Maintenance report not found' });
            }
        } else if (dbType === 'mysql') {
            const sql = `UPDATE maintenance_reports SET
                category = ?, location = ?, description = ?, priority = ?, status = ?,
                reported_by = ?, assigned_to = ?, images = ?, attachments = ?,
                estimated_cost = ?, actual_cost = ?, completion_date = ?, notes = ?,
                updated_at = NOW()
                WHERE id = ? AND report_type = "maintenance"`;
            
            const params = [
                updateData.category,
                JSON.stringify(updateData.location),
                updateData.description,
                updateData.priority,
                updateData.status,
                JSON.stringify(updateData.reported_by),
                JSON.stringify(updateData.assigned_to),
                JSON.stringify(updateData.images || []),
                JSON.stringify(updateData.attachments || []),
                updateData.estimated_cost,
                updateData.actual_cost,
                updateData.completion_date,
                updateData.notes,
                id
            ];
            
            const [result] = await db.execute(sql, params);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Maintenance report not found' });
            }
            
            const [rows] = await db.execute('SELECT * FROM maintenance_reports WHERE id = ?', [id]);
            report = rows[0];
        }

        res.json(report);
    } catch (err) {
        console.error('Error updating maintenance report:', err);
        res.status(500).json({ error: 'Failed to update maintenance report' });
    }
}

export async function deleteMaintenanceReport(req, res) {
    try {
        const { id } = req.params;
        
        const result = await MaintenanceReportModel.deleteOne({ 
            _id: id, 
            report_type: 'maintenance' 
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Maintenance report not found' });
        }

        res.json({ message: 'Maintenance report deleted successfully' });
    } catch (err) {
        console.error('Error deleting maintenance report:', err);
        res.status(500).json({ error: 'Failed to delete maintenance report' });
    }
}

export async function getMaintenanceAnalytics(req, res) {
    try {
        const reports = await MaintenanceReportModel.find({ report_type: 'maintenance' });
        
        // Category distribution
        const categoryStats = {};
        reports.forEach(r => {
            const cat = r.category || 'other';
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        });
        
        // Status distribution
        const statusStats = {};
        reports.forEach(r => {
            const status = r.status || 'Reported';
            statusStats[status] = (statusStats[status] || 0) + 1;
        });
        
        // Priority distribution
        const priorityStats = {};
        reports.forEach(r => {
            const priority = r.priority || 'Medium';
            priorityStats[priority] = (priorityStats[priority] || 0) + 1;
        });
        
        // Hall distribution
        const hallStats = {};
        reports.forEach(r => {
            const hall = r.location?.hall || 'Unknown';
            hallStats[hall] = (hallStats[hall] || 0) + 1;
        });
        
        const analytics = {
            total: reports.length,
            categoryStats: Object.entries(categoryStats).map(([k, v]) => ({ category: k, count: v })),
            statusStats: Object.entries(statusStats).map(([k, v]) => ({ status: k, count: v })),
            priorityStats: Object.entries(priorityStats).map(([k, v]) => ({ priority: k, count: v })),
            hallStats: Object.entries(hallStats).map(([k, v]) => ({ hall: k, count: v }))
        };
        
        res.json(analytics);
    } catch (err) {
        console.error('Error getting maintenance analytics:', err);
        res.status(500).json({ error: 'Failed to get maintenance analytics' });
    }
}
