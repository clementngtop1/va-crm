const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const router = express.Router();

// Validation middleware
const validateCourse = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Course name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('duration').optional().trim().isLength({ max: 50 }).withMessage('Duration must be less than 50 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { search, active, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.course.count({ where })
    ]);
    
    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: true
          }
        }
      }
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create new course
router.post('/', validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, duration, price, isActive = true } = req.body;
    
    // Check if course name already exists
    const existingCourse = await prisma.course.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    
    if (existingCourse) {
      return res.status(400).json({ error: 'Course name already exists' });
    }
    
    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        duration: duration?.trim(),
        price: parseFloat(price),
        isActive
      }
    });
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:id', validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name, description, duration, price, isActive } = req.body;
    
    // Check if course name already exists for another course
    const existingCourse = await prisma.course.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id }
      }
    });
    
    if (existingCourse) {
      return res.status(400).json({ error: 'Course name already exists' });
    }
    
    const course = await prisma.course.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim(),
        duration: duration?.trim(),
        price: parseFloat(price),
        isActive
      }
    });
    
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if course has enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id }
    });
    
    if (enrollments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete course with active enrollments',
        enrollmentsCount: enrollments.length
      });
    }
    
    await prisma.course.delete({
      where: { id }
    });
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Toggle course active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id }
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { isActive: !course.isActive }
    });
    
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error toggling course status:', error);
    res.status(500).json({ error: 'Failed to toggle course status' });
  }
});

module.exports = router;

