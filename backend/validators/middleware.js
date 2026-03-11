import { ZodError } from 'zod';

/**
 * Validation middleware factory using Zod schemas
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Where to find the data to validate
 * @returns Express middleware function
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      // Replace the source data with the validated and transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

/**
 * Format Zod errors into a more readable format
 * @param {ZodError} error - Zod validation error
 * @returns Array of formatted error messages
 */
function formatZodErrors(error) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
}

/**
 * Combined validation middleware for body, query, and params
 * @param {Object} schemas - Object with body, query, and/or params schemas
 * @returns Express middleware function
 */
export function validateAll(schemas) {
  return (req, res, next) => {
    const errors = [];
    
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      } else {
        req.body = result.data;
      }
    }
    
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      } else {
        req.query = result.data;
      }
    }
    
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      } else {
        req.params = result.data;
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}
