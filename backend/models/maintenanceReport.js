import mongoose from 'mongoose';

const maintenanceReportSchema = new mongoose.Schema({
    report_type: { 
        type: String, 
        enum: ['security', 'maintenance'], 
        required: true,
        default: 'maintenance'
    },
    category: { 
        type: String, 
        enum: ['fridge', 'light', 'socket', 'plumbing', 'furniture', 'door', 'window', 'ac', 'fan', 'other'],
        required: true 
    },
    location: {
        hall: { type: String, required: true },
        room: { type: String },
        floor: { type: String },
        building: { type: String }
    },
    description: { type: String, required: true },
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Urgent'], 
        default: 'Medium' 
    },
    status: { 
        type: String, 
        enum: ['Reported', 'Assigned', 'In Progress', 'Completed', 'Cancelled'], 
        default: 'Reported' 
    },
    reported_by: {
        student_id: { type: String },
        staff_id: { type: String },
        name: { type: String },
        contact: { type: String }
    },
    assigned_to: {
        staff_id: { type: String },
        name: { type: String },
        role: { type: String, enum: ['hall_warden', 'electrician', 'plumber', 'carpenter', 'other'] }
    },
    images: [String],
    attachments: [String],
    estimated_cost: { type: Number },
    actual_cost: { type: Number },
    completion_date: { type: Date },
    notes: String,
    created_by: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const MaintenanceReportModel = mongoose.models.MaintenanceReport || mongoose.model('MaintenanceReport', maintenanceReportSchema);

export default MaintenanceReportModel;
