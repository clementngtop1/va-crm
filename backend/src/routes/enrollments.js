const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const router = express.Router();

// Validation middleware
const validateEnrollment = [
  body('studentId').isString().notEmpty().withMessage('Student ID is required'),
  body('courseId').isString().notEmpty().withMessage('Course ID is required'),
  body('batch').optional().trim().isLength({ max: 50 }).withMessage('Batch must be less than 50 characters'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('status').optional().isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED']).withMessage('Invalid status')
];

// Get all enrollments with filters
router.get('/', async (req, res) => {
  try {
    const { 
      studentId, 
      courseId, 
      status, 
      batch, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const where = {};
    
    if (studentId) where.studentId = studentId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    if (batch) where.batch = { contains: batch, mode: 'insensitive' };
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          course: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          },
          payments: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.enrollment.count({ where })
    ]);
    
    // Calculate payment status for each enrollment
    const enrollmentsWithPaymentStatus = enrollments.map(enrollment => {
      const totalPaid = enrollment.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const coursePrice = parseFloat(enrollment.course.price);
      const outstanding = Math.max(0, coursePrice - totalPaid);
      
      return {
        ...enrollment,
        paymentStatus: {
          totalPaid,
          outstanding,
          isFullyPaid: outstanding <= 0
        }
      };
    });
    
    res.json({
      enrollments: enrollmentsWithPaymentStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get single enrollment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
        payments: {
          orderBy: { date: 'desc' }
        }
      }
    });
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    // Calculate payment status
    const totalPaid = enrollment.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const coursePrice = parseFloat(enrollment.course.price);
    const outstanding = Math.max(0, coursePrice - totalPaid);
    
    const enrollmentWithPaymentStatus = {
      ...enrollment,
      paymentStatus: {
        totalPaid,
        outstanding,
        isFullyPaid: outstanding <= 0
      }
    };
    
    res.json(enrollmentWithPaymentStatus);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// Create new enrollment
router.post('/', validateEnrollment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { studentId, courseId, batch, startDate, endDate, status = 'ACTIVE' } = req.body;
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      return res.status(400).json({ error: 'Course not found' });
    }
    
    if (!course.isActive) {
      return res.status(400).json({ error: 'Course is not active' });
    }
    
    // Check if student is already enrolled in this course with ACTIVE status
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        status: 'ACTIVE'
      }
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }
    
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        batch: batch?.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status
      },
      include: {
        student: true,
        course: true
      }
    });
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

// Update enrollment
router.put('/:id', validateEnrollment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { studentId, courseId, batch, startDate, endDate, status } = req.body;
    
    // Check if enrollment exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id }
    });
    
    if (!existingEnrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    // Check if student exists
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });
      
      if (!student) {
        return res.status(400).json({ error: 'Student not found' });
      }
    }
    
    // Check if course exists and is active
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });
      
      if (!course) {
        return res.status(400).json({ error: 'Course not found' });
      }
      
      if (!course.isActive) {
        return res.status(400).json({ error: 'Course is not active' });
      }
    }
    
    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        studentId: studentId || existingEnrollment.studentId,
        courseId: courseId || existingEnrollment.courseId,
        batch: batch?.trim() || existingEnrollment.batch,
        startDate: startDate ? new Date(startDate) : existingEnrollment.startDate,
        endDate: endDate ? new Date(endDate) : existingEnrollment.endDate,
        status: status || existingEnrollment.status
      },
      include: {
        student: true,
        course: true
      }
    });
    
    res.json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// Update enrollment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: { status },
      include: {
        student: true,
        course: true
      }
    });
    
    res.json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.status(500).json({ error: 'Failed to update enrollment status' });
  }
});

// Delete enrollment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if enrollment has payments
    const payments = await prisma.payment.findMany({
      where: { enrollmentId: id }
    });
    
    if (payments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete enrollment with payment records',
        paymentsCount: payments.length
      });
    }
    
    await prisma.enrollment.delete({
      where: { id }
    });
    
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

module.exports = router;

