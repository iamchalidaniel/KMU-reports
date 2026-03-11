import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import * as Sentry from '@sentry/node';

dotenv.config();

// Initialize Sentry for error monitoring (only if DSN is provided)
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.1, // Capture 10% of transactions
    });
    console.log('Sentry initialized for error monitoring');
}

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

// Sentry request handler (must be before other middleware)
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
}

// Security: Set HTTP headers
app.use(helmet());

// Security: Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Security: Stricter rate limit for auth endpoints - 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
});
app.use('/api/login', authLimiter);
app.use('/api/student-register', authLimiter);

// Security: Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Security: Data sanitization against XSS
app.use(xss());

// Request logging
app.use(morgan('combined'));

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

// API Documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'KMU Reports API Docs'
}));

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

// Sentry error handler (must be before global error handler)
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    const status = err.status || err.statusCode || 500;
    const message = (process.env.NODE_ENV === 'production' && status === 500)
        ? 'Internal server error'
        : (err.message || 'Server error');
    res.status(status).json({ error: message });
});

export default app;
