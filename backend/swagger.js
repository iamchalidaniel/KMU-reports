import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KMU Reports API',
      version: '1.0.0',
      description: 'Comprehensive Reporting Management System API for Kalinga Medical University',
      contact: {
        name: 'API Support',
        email: 'support@kmu.edu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            name: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['admin', 'user', 'security_officer', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary', 'hall_warden', 'electrician', 'student']
            },
            email: { type: 'string', format: 'email' },
            studentId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Student: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            contact: { type: 'string' },
            program: { type: 'string' },
            roomNo: { type: 'string' },
            year: { type: 'string' },
            gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
            status: { type: 'string', enum: ['REGISTERED', 'NOT_REGISTERED', 'GRADUATED', 'SUSPENDED'] }
          }
        },
        Case: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student_id: { type: 'string' },
            student_ids: { type: 'array', items: { type: 'string' } },
            offense_type: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['open', 'under_investigation', 'closed', 'appealed', 'dismissed'] },
            severity: { type: 'string', enum: ['minor', 'moderate', 'serious', 'very_serious'] },
            incident_date: { type: 'string', format: 'date' },
            location: { type: 'string' },
            verdict: { type: 'string' },
            penalty: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string', format: 'password' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Students', description: 'Student management endpoints' },
      { name: 'Cases', description: 'Disciplinary case management endpoints' },
      { name: 'Staff', description: 'Staff management endpoints' },
      { name: 'Reports', description: 'Report generation endpoints' },
      { name: 'Maintenance', description: 'Maintenance request endpoints' },
      { name: 'Audit', description: 'Audit log endpoints' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
