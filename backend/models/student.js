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

    // New Fields from Requirements
    yearOfStudy: String,
    status: { type: String, default: 'REGISTERED' },
    deliveryMode: { type: String, default: 'FULLTIME' },
    firstName: String,
    surName: String,
    nrc: String,
    passport: String,
    maritalStatus: String,
    nationality: String,
    dateOfBirth: String,
    province: String,
    town: String,
    address: String,
    phone: String,

    lastSelected: Date,
    createdAt: { type: Date, default: Date.now },
});

const StudentModel = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default StudentModel;