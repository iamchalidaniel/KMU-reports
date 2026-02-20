import AuditModel from '../models/audit.js';

export async function listAuditLogs(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const total = await AuditModel.countDocuments();
        const logs = await AuditModel.find()
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get aggregated statistics for all logs
        const stats = await AuditModel.aggregate([{
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        }]);

        // Convert stats to a more usable format
        const statsMap = {};
        stats.forEach(stat => {
            statsMap[stat._id] = stat.count;
        });

        res.json({ logs, total, stats: statsMap });
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function logAudit({ action, entity, entityId, user, details, ipAddress, userAgent }) {
    try {
        await AuditModel.create({
            action,
            entity,
            entityId,
            user,
            details,
            ipAddress,
            userAgent,
            date: new Date(),
        });
    } catch (err) {
        console.error('Error logging audit:', err);
    }
}