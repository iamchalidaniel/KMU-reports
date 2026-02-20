import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    department: String,
    year: String,
    gender: String,
    email: String,
    contact: String,
    program: String,
    roomNo: String,
    lastSelected: Date,
    createdAt: { type: Date, default: Date.now },
});

const StudentModel = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default StudentModel;