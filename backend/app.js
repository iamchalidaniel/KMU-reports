import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import usersRouter from './routes/users.js';
import studentsRouter from './routes/students.js';
import staffRouter from './routes/staff.js';
import casesRouter from './routes/cases.js';
import appealsRouter from './routes/appeals.js';
import studentReportsRouter from './routes/studentReports.js';
import reportsRouter from './routes/reports.js';
import maintenanceRouter from './routes/maintenance.js';
import authRouter from './routes/auth.js';
import evidenceRouter from './routes/evidence.js';
import auditRouter from './routes/audit.js';
import healthRouter from './routes/health.js';
import publicRouter from './routes/public.js';

const app = express();

// CORS configuration - flexible for any deployment environment
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL ;
// Handle multiple origins if provided as comma-separated values
let origins;
if (Array.isArray(corsOrigin)) {
    origins = corsOrigin;
} else if (typeof corsOrigin === 'string') {
    // Split by comma for multiple origins, or use as single origin
    origins = corsOrigin.includes(',') ? corsOrigin.split(',').map(origin => origin.trim()) : corsOrigin;
} else {
    origins = 'http://localhost:3000';
}

app.use(cors({
    origin: origins,
    credentials: true,
}));
app.use(express.json());

// Register API routes
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/cases', casesRouter);
app.use('/api/appeals', appealsRouter);
app.use('/api/student-reports', studentReportsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api', authRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/audit', auditRouter);
app.use('/api/health', healthRouter);
app.use('/api/public', publicRouter);

// Health check endpoint (legacy)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'KMU Reports Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Catch-all for unhandled API routes
app.use('/api/*', (req, res) => {
    console.log('Unhandled API route:', req.method, req.originalUrl);
    res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Server error' });
});

export default app;
