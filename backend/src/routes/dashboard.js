const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const [
      totalStudents,
      activeEnrollments,
      completedEnrollments,
      totalCourses,
      activeCourses,
      totalPayments,
      totalRevenue,
      activeEnrollmentsList
    ] = await Promise.all([
      // Total students
      prisma.student.count(),
      
      // Active enrollments
      prisma.enrollment.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Completed enrollments
      prisma.enrollment.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Total courses
      prisma.course.count(),
      
      // Active courses
      prisma.course.count({
        where: { isActive: true }
      }),
      
      // Total payments
      prisma.payment.count(),
      
      // Total revenue
      prisma.payment.aggregate({
        _sum: { amount: true }
      }),
      
      // Active enrollments list for outstanding calculation
      prisma.enrollment.findMany({
        where: { status: 'ACTIVE' },
        include: {
          course: true,
          payments: true
        }
      })
    ]);
    
    // Calculate outstanding amount
    const outstandingAmount = activeEnrollmentsList.reduce((total, enrollment) => {
      const totalPaid = enrollment.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const coursePrice = parseFloat(enrollment.course.price);
      return total + Math.max(0, coursePrice - totalPaid);
    }, 0);
    
    // Get recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });
    
    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: {
            name: true
          }
        },
        enrollment: {
          include: {
            course: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    // Get course enrollment counts
    const courseEnrollments = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: 5
    });
    
    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await prisma.payment.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        date: { gte: sixMonthsAgo }
      },
      orderBy: { date: 'asc' }
    });
    
    // Group by month
    const monthlyRevenueMap = {};
    monthlyRevenue.forEach(payment => {
      const month = payment.date.toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyRevenueMap[month]) {
        monthlyRevenueMap[month] = 0;
      }
      monthlyRevenueMap[month] += parseFloat(payment._sum.amount);
    });
    
    const monthlyRevenueData = Object.entries(monthlyRevenueMap).map(([month, amount]) => ({
      month,
      amount
    }));
    
    res.json({
      overview: {
        totalStudents,
        activeEnrollments,
        completedEnrollments,
        totalCourses,
        activeCourses,
        totalPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
        outstandingAmount
      },
      recentEnrollments,
      recentPayments,
      courseEnrollments,
      monthlyRevenue: monthlyRevenueData
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get enrollment statistics
router.get('/enrollments', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      cancelledEnrollments,
      newEnrollments
    ] = await Promise.all([
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
      prisma.enrollment.count({ where: { status: 'CANCELLED' } }),
      prisma.enrollment.count({
        where: { createdAt: { gte: startDate } }
      })
    ]);
    
    // Get enrollments by course
    const enrollmentsByCourse = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      }
    });
    
    // Get enrollments by status over time
    const enrollmentsOverTime = await prisma.enrollment.groupBy({
      by: ['status', 'createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({
      statistics: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        cancelled: cancelledEnrollments,
        new: newEnrollments
      },
      byCourse: enrollmentsByCourse,
      overTime: enrollmentsOverTime
    });
  } catch (error) {
    console.error('Error fetching enrollment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment statistics' });
  }
});

// Get payment statistics
router.get('/payments', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const [
      totalRevenue,
      periodRevenue,
      activeEnrollmentsForOutstanding,
      paymentsByMethod
    ] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        _sum: { amount: true }
      }),
      
      // Revenue for the period
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startDate } }
      }),
      
      // Active enrollments list for outstanding calculation
      prisma.enrollment.findMany({
        where: { status: 'ACTIVE' },
        include: {
          course: true,
          payments: true
        }
      }),
      
      // Payments by method
      prisma.payment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);
    
    // Calculate outstanding amount
    const outstandingAmount = activeEnrollmentsForOutstanding.reduce((total, enrollment) => {
      const totalPaid = enrollment.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const coursePrice = parseFloat(enrollment.course.price);
      return total + Math.max(0, coursePrice - totalPaid);
    }, 0);
    
    // Get daily revenue for the period
    const dailyRevenue = await prisma.payment.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });
    
    const dailyRevenueData = dailyRevenue.map(day => ({
      date: day.date.toISOString().split('T')[0],
      amount: parseFloat(day._sum.amount)
    }));
    
    res.json({
      revenue: {
        total: totalRevenue._sum.amount || 0,
        period: periodRevenue._sum.amount || 0,
        outstanding: outstandingAmount
      },
      byMethod: paymentsByMethod.map(method => ({
        method: method.method,
        amount: parseFloat(method._sum.amount),
        count: method._count.id
      })),
      daily: dailyRevenueData
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Get student statistics
router.get('/students', async (req, res) => {
  try {
    const [
      totalStudents,
      newStudentsThisMonth,
      studentsByCourse,
      topStudents
    ] = await Promise.all([
      // Total students
      prisma.student.count(),
      
      // New students this month
      prisma.student.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Students by course
      prisma.course.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: {
          enrollments: {
            _count: 'desc'
          }
        }
      }),
      
      // Top students by enrollment count
      prisma.student.findMany({
        include: {
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: {
          enrollments: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);
    
    res.json({
      total: totalStudents,
      newThisMonth: newStudentsThisMonth,
      byCourse: studentsByCourse.map(course => ({
        courseName: course.name,
        studentCount: course._count.enrollments
      })),
      topStudents: topStudents.map(student => ({
        name: student.name,
        email: student.email,
        enrollmentCount: student._count.enrollments
      }))
    });
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

module.exports = router;

