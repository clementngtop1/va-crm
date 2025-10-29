const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { Prisma } = require('../generated/prisma-client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Validation middleware
const validateStudent = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
  body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 characters'),
  body('nricPassportId').optional().trim().isLength({ min: 3 }).withMessage('NRIC/Passport required')
];

// Multer storage for student documents
const docsDir = path.join(__dirname, '../uploads/student-docs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
    cb(null, docsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const uploadDocs = multer({ storage });

// Get all students with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, course, status, page = 1, limit = 20 } = req.query;
    
    const where = {};
    const enrollmentWhere = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (course) {
      enrollmentWhere.course = {
        name: { contains: course, mode: 'insensitive' }
      };
    }
    if (status) {
      enrollmentWhere.status = status;
    }
    if (Object.keys(enrollmentWhere).length > 0) {
      where.enrollments = { some: enrollmentWhere };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            include: {
              course: true,
              payments: true
            }
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.student.count({ where })
    ]);
    
    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            course: true,
            payments: true
          }
        }
      }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create new student
router.post('/', validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, phone, nricPassportId, address, remarks, documents } = req.body;
    
    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    });
    
    if (existingStudent) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const student = await prisma.student.create({
      data: { 
        name, 
        email, 
        phone,
        nricPassportId: nricPassportId || undefined,
        address: address || undefined,
        remarks: remarks || undefined,
        documents: Array.isArray(documents) ? documents : []
      }
    });
    
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/:id', validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name, email, phone, nricPassportId, address, remarks, documents } = req.body;
    
    // Check if email already exists for another student
    const existingStudent = await prisma.student.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });
    
    if (existingStudent) {
      return res.status(400).json({ error: 'Email already registered to another student' });
    }
    
    const student = await prisma.student.update({
      where: { id },
      data: { name, email, phone, nricPassportId, address, remarks, documents }
    });
    
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.student.delete({
      where: { id }
    });
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Bulk import students from CSV data
router.post('/bulk-import', async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students data is required and must be an array' });
    }
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      try {
        // Validate required fields
        if (!studentData.name || !studentData.email || !studentData.phone) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields (name, email, phone)',
            data: studentData
          });
          continue;
        }
        
        // Check if email already exists
        const existingStudent = await prisma.student.findUnique({
          where: { email: studentData.email }
        });
        
        if (existingStudent) {
          errors.push({
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
        
        results.push(student);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: studentData
        });
      }
    }
    
    res.json({
      message: `Successfully imported ${results.length} students`,
      imported: results.length,
      total: students.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk importing students:', error);
    res.status(500).json({ error: 'Failed to bulk import students' });
  }
});

module.exports = router;

// Composite full-create endpoint: student (+optional enrollment, payment) with docs upload
// Form-Data keys:
//  - data: JSON string { student:{...}, enrollment?:{...}, payment?:{...} }
//  - docs: files[]
router.post('/full-create', uploadDocs.array('docs', 10), async (req, res) => {
  try {
    const parsed = JSON.parse(req.body.data || '{}');
    const { student: studentPayload, enrollment, payment } = parsed;

    if (!studentPayload?.name || !studentPayload?.email || !studentPayload?.phone || !studentPayload?.nricPassportId) {
      return res.status(400).json({ error: 'Missing required student fields' });
    }

    // collect uploaded file paths
    const docPaths = (req.files || []).map(f => `/uploads/student-docs/${f.filename}`);

    const result = await prisma.$transaction(async (tx) => {
      // ensure NRIC/Passport unique
      const dup = await tx.student.findFirst({ where: { nricPassportId: studentPayload.nricPassportId } });
      if (dup) throw new Error('NRIC/Passport ID already exists');

      const createdStudent = await tx.student.create({
        data: {
          name: studentPayload.name,
          email: studentPayload.email,
          phone: studentPayload.phone,
          nricPassportId: studentPayload.nricPassportId,
          address: studentPayload.address || undefined,
          remarks: studentPayload.remarks || undefined,
          documents: [...(studentPayload.documents || []), ...docPaths]
        }
      });

      let createdEnrollment = null;
      let createdPayment = null;

      if (enrollment?.courseId) {
        createdEnrollment = await tx.enrollment.create({
          data: {
            studentId: createdStudent.id,
            courseId: enrollment.courseId,
            batch: enrollment.batch || undefined,
            startDate: enrollment.startDate ? new Date(enrollment.startDate) : new Date(),
            endDate: enrollment.endDate ? new Date(enrollment.endDate) : null,
            status: enrollment.status || 'ACTIVE'
          }
        });
      }

      if (payment?.amount && payment?.method && payment?.date) {
        const enrollmentId = payment.applyTo === 'enrollment' ? createdEnrollment?.id : (payment.enrollmentId || null);
        createdPayment = await tx.payment.create({
          data: {
            studentId: createdStudent.id,
            enrollmentId: enrollmentId || (createdEnrollment ? createdEnrollment.id : payment.enrollmentId),
            amount: new Prisma.Decimal(payment.amount),
            method: payment.method,
            date: new Date(payment.date),
            notes: payment.notes || undefined
          }
        });
      }

      return { createdStudent, createdEnrollment, createdPayment };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('full-create error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(400).json({ error: 'Email address already exists. Please use a different email.' });
      } else if (field === 'nricPassportId') {
        return res.status(400).json({ error: 'NRIC/Passport ID already exists. Please use a different ID.' });
      }
    }
    
    // Handle validation errors
    if (error.message.includes('NRIC/Passport ID already exists')) {
      return res.status(400).json({ error: 'NRIC/Passport ID already exists. Please use a different ID.' });
    }
    
    // Handle decimal errors
    if (error.message.includes('Decimal')) {
      return res.status(400).json({ error: 'Invalid payment amount. Please enter a valid number.' });
    }
    
    res.status(400).json({ error: error.message || 'Failed to create student' });
  }
});

