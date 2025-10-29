const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Parse CSV file and return data
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        if (!data.name || !data.email || !data.phone) {
          errors.push({
            row: results.length + 1,
            error: 'Missing required fields (name, email, phone)',
            data
          });
          return;
        }
        
        // Clean and validate data
        const cleanedData = {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          course: data.course?.trim(),
          batch: data.batch?.trim(),
          startDate: data.startDate?.trim(),
          notes: data.notes?.trim()
        };
        
        // Basic validation
        if (cleanedData.name.length < 2) {
          errors.push({
            row: results.length + 1,
            error: 'Name must be at least 2 characters',
            data: cleanedData
          });
          return;
        }
        
        if (!cleanedData.email.includes('@')) {
          errors.push({
            row: results.length + 1,
            error: 'Invalid email format',
            data: cleanedData
          });
          return;
        }
        
        if (cleanedData.phone.length < 10) {
          errors.push({
            row: results.length + 1,
            error: 'Phone number too short',
            data: cleanedData
          });
          return;
        }
        
        results.push(cleanedData);
      })
      .on('end', () => {
        resolve({ results, errors });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Upload CSV file for preview
router.post('/csv-preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const { results, errors } = await parseCSV(filePath);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      message: 'CSV parsed successfully',
      totalRows: results.length + errors.length,
      validRows: results.length,
      errorRows: errors.length,
      preview: results.slice(0, 10), // Show first 10 rows
      errors: errors.slice(0, 10), // Show first 10 errors
      sampleData: results.length > 0 ? results[0] : null
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to parse CSV file' });
  }
});

// Import students from CSV data
router.post('/import-students', [
  body('students').isArray().withMessage('Students data must be an array'),
  body('students.*.name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('students.*.email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
  body('students.*.phone').trim().isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 characters')
], async (req, res) => {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json({ errors: validation.array() });
    }
    
    const { students, createEnrollments = false } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students data is required and must be an array' });
    }
    
    const importedStudents = [];
    const importErrors = [];
    const createdEnrollments = [];
    
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      try {
        // Check if email already exists
        const existingStudent = await prisma.student.findUnique({
          where: { email: studentData.email }
        });
        
        if (existingStudent) {
          importErrors.push({
            row: i + 1,
            error: 'Email already registered',
            data: studentData
          });
          continue;
        }
        
        // Create student
        const student = await prisma.student.create({
          data: {
            name: studentData.name.trim(),
            email: studentData.email.trim().toLowerCase(),
            phone: studentData.phone.trim()
          }
        });
        
        importedStudents.push(student);
        
        // Create enrollment if requested and course data is provided
        if (createEnrollments && studentData.course) {
          try {
            // Find or create course
            let course = await prisma.course.findFirst({
              where: { 
                name: { equals: studentData.course, mode: 'insensitive' },
                isActive: true
              }
            });
            
            if (!course) {
              course = await prisma.course.create({
                data: {
                  name: studentData.course.trim(),
                  description: `Auto-created from CSV import`,
                  price: 0, // Default price, can be updated later
                  isActive: true
                }
              });
            }
            
            // Create enrollment
            const enrollment = await prisma.enrollment.create({
              data: {
                studentId: student.id,
                courseId: course.id,
                batch: studentData.batch?.trim() || 'CSV Import',
                startDate: studentData.startDate ? new Date(studentData.startDate) : new Date(),
                status: 'ACTIVE'
              }
            });
            
            createdEnrollments.push(enrollment);
          } catch (enrollmentError) {
            console.error(`Error creating enrollment for student ${student.id}:`, enrollmentError);
            importErrors.push({
              row: i + 1,
              error: `Student created but enrollment failed: ${enrollmentError.message}`,
              data: studentData
            });
          }
        }
      } catch (error) {
        importErrors.push({
          row: i + 1,
          error: error.message,
          data: studentData
        });
      }
    }
    
    res.json({
      message: `Successfully imported ${importedStudents.length} students`,
      imported: importedStudents.length,
      total: students.length,
      enrollmentsCreated: createdEnrollments.length,
      results: importedStudents,
      errors: importErrors
    });
  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
});

// Get upload template
router.get('/template', (req, res) => {
  const template = [
    'name,email,phone,course,batch,startDate,notes',
    'John Doe,john@example.com,1234567890,Web Development,Batch 2024-01,2024-01-15,Imported from CSV',
    'Jane Smith,jane@example.com,0987654321,Data Science,Batch 2024-01,2024-01-15,Imported from CSV'
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students-template.csv"');
  res.send(template);
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${error.message}` });
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({ error: 'Only CSV files are allowed' });
  }
  
  next(error);
});

module.exports = router;

