import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserModel from '../models/user.js';
import StudentModel from '../models/student.js';
import { logAudit } from './auditController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function login(req, res) {
    const { username, password } = req.body;
    console.log('Login attempt:', username);
    try {
        let user = await UserModel.findOne({ username });
        console.log('User found:', !!user, user && user.username, user && user.role);
        if (!user) {
            // Audit log for failed login (user not found)
            await logAudit({
                action: 'login_failed',
                entity: 'user',
                entityId: null,
                user: username,
                details: {
                    reason: 'User not found',
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const valid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', valid);
        if (!valid) {
            // Audit log for failed login (invalid password)
            await logAudit({
                action: 'login_failed',
                entity: 'user',
                entityId: user._id || user.id,
                user: username,
                details: {
                    reason: 'Invalid password',
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const payload = { id: user._id || user.id, role: user.role, username: user.username };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // Audit log for successful login
        await logAudit({
            action: 'user_login',
            entity: 'user',
            entityId: user._id || user.id,
            user: username,
            details: {
                role: user.role,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ token, user: payload });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function register(req, res) {
    const { username, password, name, role } = req.body;
    try {
        const exists = await UserModel.findOne({ username });
        if (exists) return res.status(409).json({ error: 'Username already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await UserModel.create({ username, password: hashed, name, role });

        // Audit log for user registration
        await logAudit({
            action: 'user_registered',
            entity: 'user',
            entityId: user._id || user.id,
            user: username,
            details: {
                name,
                role: role || 'user',
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function registerStudent(req, res) {
    const { sin, name, contact, email, program, roomNo, password } = req.body;
    
    try {
        // Validate required fields
        if (!sin || !name || !email || !program || !roomNo || !password) {
            return res.status(400).json({ error: 'Missing required fields: SIN, name, email, program, room number, and password are required' });
        }

        // Validate password
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if student ID (SIN) already exists
        const existingStudent = await StudentModel.findOne({ studentId: sin });
        if (existingStudent) {
            return res.status(409).json({ error: 'Student ID already registered' });
        }

        // Check if email is already used
        const existingEmail = await StudentModel.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Check if username (using SIN or email) already exists in User model
        const username = sin; // Use SIN as username
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Student ID already registered as user' });
        }

        // Generate a temporary password (students will need to reset it on first login)
        // In production, you might want to send this via email or require password during registration
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create User account with role 'student'
        const user = await UserModel.create({
            username: username,
            password: hashedPassword,
            name: name,
            role: 'student',
            studentId: sin // Store SIN for reference
        });

        // Create Student record
        const student = await StudentModel.create({
            studentId: sin,
            fullName: name,
            email: email,
            contact: contact || '',
            program: program,
            roomNo: roomNo,
            department: program.split(' ')[0] || '', // Extract department from program if possible
        });

        // Audit log for student registration
        await logAudit({
            action: 'student_registered',
            entity: 'student',
            entityId: student._id || student.id,
            user: sin,
            details: {
                name,
                email,
                program,
                roomNo,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Return success (don't return password)
        res.status(201).json({
            success: true,
            message: 'Student registration successful! You can now login with your Student ID and password.',
            student: {
                studentId: student.studentId,
                name: student.fullName,
                email: student.email,
                program: student.program,
                roomNo: student.roomNo
            }
        });
    } catch (err) {
        console.error('Student registration error:', err);
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json({ 
                error: `${field === 'studentId' ? 'Student ID' : field} already exists` 
            });
        }
        
        res.status(500).json({ error: 'Server error during registration' });
    }
}