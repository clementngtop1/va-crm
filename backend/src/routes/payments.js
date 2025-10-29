const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const router = express.Router();

// Validation middleware
const validatePayment = [
  body('studentId').isString().notEmpty().withMessage('Student ID is required'),
  body('enrollmentId').isString().notEmpty().withMessage('Enrollment ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE_PAYMENT', 'CHECK']).withMessage('Invalid payment method'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

// Get all payments with filters
router.get('/', async (req, res) => {
  try {
    const { 
      studentId, 
      enrollmentId, 
      method, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const where = {};
    
    if (studentId) where.studentId = studentId;
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (method) where.method = method;
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) where.date = { lte: new Date(endDate) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          enrollment: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.payment.count({ where })
    ]);
    
    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
        enrollment: {
          include: {
            course: true
          }
        }
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post('/', validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { studentId, enrollmentId, amount, method, date, notes } = req.body;
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true
      }
    });
    
    if (!enrollment) {
      return res.status(400).json({ error: 'Enrollment not found' });
    }
    
    // Check if enrollment belongs to the student
    if (enrollment.studentId !== studentId) {
      return res.status(400).json({ error: 'Enrollment does not belong to the specified student' });
    }
    
    // Check if enrollment is active
    if (enrollment.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot record payment for inactive enrollment' });
    }
    
    // Calculate total paid so far
    const existingPayments = await prisma.payment.findMany({
      where: { enrollmentId }
    });
    
    const totalPaid = existingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const coursePrice = parseFloat(enrollment.course.price);
    const newTotalPaid = totalPaid + parseFloat(amount);
    
    // Check if payment exceeds course price
    if (newTotalPaid > coursePrice) {
      return res.status(400).json({ 
        error: 'Payment amount exceeds course price',
        coursePrice,
        totalPaid,
        remaining: coursePrice - totalPaid
      });
    }
    
    const payment = await prisma.payment.create({
      data: {
        studentId,
        enrollmentId,
        amount: parseFloat(amount),
        method,
        date: new Date(date),
        notes: notes?.trim()
      },
      include: {
        student: true,
        enrollment: {
          include: {
            course: true
          }
        }
      }
    });
    
    // Update enrollment status if fully paid
    if (newTotalPaid >= coursePrice) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'COMPLETED' }
      });
    }
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { studentId, enrollmentId, amount, method, date, notes } = req.body;
    
    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
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
    
    // Check if enrollment exists
    if (enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: true
        }
      });
      
      if (!enrollment) {
        return res.status(400).json({ error: 'Enrollment not found' });
      }
      
      // Check if enrollment belongs to the student
      if (enrollment.studentId !== (studentId || existingPayment.studentId)) {
        return res.status(400).json({ error: 'Enrollment does not belong to the specified student' });
      }
    }
    
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        studentId: studentId || existingPayment.studentId,
        enrollmentId: enrollmentId || existingPayment.enrollmentId,
        amount: parseFloat(amount),
        method,
        date: new Date(date),
        notes: notes?.trim()
      },
      include: {
        student: true,
        enrollment: {
          include: {
            course: true
          }
        }
      }
    });
    
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.payment.delete({
      where: { id }
    });
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// Get payment summary for a student
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get all enrollments for the student
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: true,
        payments: true
      }
    });
    
    const summary = enrollments.map(enrollment => {
      const totalPaid = enrollment.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const coursePrice = parseFloat(enrollment.course.price);
      const outstanding = Math.max(0, coursePrice - totalPaid);
      
      return {
        enrollmentId: enrollment.id,
        courseName: enrollment.course.name,
        coursePrice,
        totalPaid,
        outstanding,
        isFullyPaid: outstanding <= 0,
        status: enrollment.status,
        startDate: enrollment.startDate,
        endDate: enrollment.endDate
      };
    });
    
    const totalOutstanding = summary.reduce((sum, item) => sum + item.outstanding, 0);
    const totalPaid = summary.reduce((sum, item) => sum + item.totalPaid, 0);
    
    res.json({
      studentId,
      summary,
      totals: {
        outstanding: totalOutstanding,
        paid: totalPaid
      }
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

module.exports = router;

