# Super Admin Backend API Integration Guide

## 🎯 Overview

This guide provides complete backend API specifications for integrating the Super Admin Dashboard with your backend services. All frontend components are ready and waiting for API integration.

---

## 📋 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Dashboard Overview APIs](#dashboard-overview-apis)
3. [User Management APIs](#user-management-apis)
4. [Analytics APIs](#analytics-apis)
5. [Transaction APIs](#transaction-apis)
6. [Approval APIs](#approval-apis)
7. [HMO Plans Management APIs](#hmo-plans-management-apis)
8. [System Logs APIs](#system-logs-apis)
9. [Settings APIs](#settings-apis)
10. [Database Schema](#database-schema)
11. [Error Handling](#error-handling)
12. [Implementation Examples](#implementation-examples)

---

## 🔐 Authentication & Authorization

### Admin Authentication Flow

```typescript
// POST /api/admin/auth/login
interface AdminLoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface AdminLoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'super_admin' | 'admin' | 'moderator';
      permissions: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
  message: string;
}
```

### Required Headers for Admin Routes

```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json',
  'X-Admin-Role': 'super_admin'
}
```

### Middleware Example

```javascript
// middleware/adminAuth.js
const verifyAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    // Verify admin role
    if (!['super_admin', 'admin', 'moderator'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Check for super admin specifically
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

module.exports = { verifyAdminAuth, requireSuperAdmin };
```

---

## 📊 Dashboard Overview APIs

### Get Dashboard Stats

```typescript
// GET /api/admin/dashboard/stats
interface DashboardStatsResponse {
  success: boolean;
  data: {
    totalUsers: {
      value: number;
      change: number; // percentage
      trend: 'up' | 'down';
    };
    activeSessions: {
      value: number;
      change: number;
      trend: 'up' | 'down';
    };
    platformRevenue: {
      value: number;
      currency: string;
      change: number;
      trend: 'up' | 'down';
    };
    pendingApprovals: {
      value: number;
      change: number;
      trend: 'up' | 'down';
    };
  };
}
```

**Implementation:**

```javascript
// routes/admin/dashboard.js
router.get('/dashboard/stats', verifyAdminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      lastMonthUsers,
      activeSessions,
      revenue,
      pendingApprovals
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({
        status: { $ne: 'deleted' },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Session.countDocuments({ expiresAt: { $gt: new Date() } }),
      Transaction.aggregate([
        { $match: { status: 'completed', type: 'platform_fee' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Approval.countDocuments({ status: 'pending' })
    ]);

    const userGrowth = ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        totalUsers: {
          value: totalUsers,
          change: parseFloat(userGrowth),
          trend: userGrowth >= 0 ? 'up' : 'down'
        },
        activeSessions: {
          value: activeSessions,
          change: 8,
          trend: 'up'
        },
        platformRevenue: {
          value: revenue[0]?.total || 0,
          currency: 'USD',
          change: 23,
          trend: 'up'
        },
        pendingApprovals: {
          value: pendingApprovals,
          change: -5,
          trend: 'down'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Get User Distribution

```typescript
// GET /api/admin/dashboard/user-distribution
interface UserDistributionResponse {
  success: boolean;
  data: {
    patients: { count: number; percentage: number };
    providers: { count: number; percentage: number };
    vendors: { count: number; percentage: number };
    sponsors: { count: number; percentage: number };
  };
}
```

### Get Recent Activity

```typescript
// GET /api/admin/dashboard/activity?limit=10
interface RecentActivityResponse {
  success: boolean;
  data: {
    activities: Array<{
      id: string;
      action: string;
      user: {
        id: string;
        name: string;
        type: string;
      };
      timestamp: string;
      type: 'registration' | 'payment' | 'product' | 'issue' | 'sponsorship';
    }>;
    total: number;
  };
}
```

### Get System Health

```typescript
// GET /api/admin/dashboard/system-health
interface SystemHealthResponse {
  success: boolean;
  data: {
    api: {
      responseTime: number; // milliseconds
      uptime: number; // percentage
      status: 'healthy' | 'warning' | 'critical';
    };
    database: {
      uptime: number;
      queryTime: number;
      connections: { active: number; max: number };
      status: 'healthy' | 'warning' | 'critical';
    };
    errorRate: {
      rate: number;
      status: 'healthy' | 'warning' | 'critical';
    };
    storage: {
      used: number; // GB
      total: number; // GB
      percentage: number;
      status: 'healthy' | 'warning' | 'critical';
    };
  };
}
```

---

## 👥 User Management APIs

### List All Users

```typescript
// GET /api/admin/users?page=1&limit=10&type=all&status=all&search=query
interface ListUsersRequest {
  page?: number;
  limit?: number;
  type?: 'all' | 'patient' | 'provider' | 'vendor' | 'sponsor';
  status?: 'all' | 'active' | 'pending' | 'inactive' | 'suspended';
  search?: string; // searches name, email, phone
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

interface ListUsersResponse {
  success: boolean;
  data: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      userType: 'patient' | 'provider' | 'vendor' | 'sponsor';
      status: 'active' | 'pending' | 'inactive' | 'suspended';
      joinDate: string;
      lastActive: string;
      avatar?: string;
      metadata?: {
        licenseNumber?: string; // for providers
        businessLicense?: string; // for vendors
        organizationName?: string; // for sponsors
      };
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

**Implementation:**

```javascript
// routes/admin/users.js
router.get('/users', verifyAdminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type = 'all',
      status = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (type !== 'all') {
      query.userType = type;
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total
    const total = await User.countDocuments(query);

    // Fetch users
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      status: user.status,
      joinDate: user.createdAt,
      lastActive: user.lastActiveAt || user.updatedAt,
      avatar: user.profile.avatar,
      metadata: getMetadataByType(user)
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function getMetadataByType(user) {
  switch(user.userType) {
    case 'provider':
      return { licenseNumber: user.licenseNumber };
    case 'vendor':
      return { businessLicense: user.businessLicense };
    case 'sponsor':
      return { organizationName: user.organizationName };
    default:
      return {};
  }
}
```

### Get User Details

```typescript
// GET /api/admin/users/:userId
interface UserDetailsResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    phone: string;
    userType: string;
    status: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
      dateOfBirth: string;
    };
    joinDate: string;
    lastActive: string;
    activity: {
      totalTransactions: number;
      totalSpent?: number;
      totalEarned?: number;
    };
    // Type-specific data
    providerData?: {
      licenseNumber: string;
      specialization: string;
      yearsOfExperience: number;
    };
    vendorData?: {
      businessLicense: string;
      companyName: string;
      productsCount: number;
    };
  };
}
```

### Update User Status

```typescript
// PUT /api/admin/users/:userId/status
interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
  notifyUser?: boolean;
}

interface UpdateUserStatusResponse {
  success: boolean;
  data: {
    userId: string;
    newStatus: string;
    updatedAt: string;
  };
  message: string;
}
```

**Implementation:**

```javascript
router.put('/users/:userId/status', verifyAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason, notifyUser = true } = req.body;

    // Validate status
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        status,
        $push: {
          statusHistory: {
            status,
            reason,
            changedBy: req.admin.id,
            changedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send notification if requested
    if (notifyUser) {
      await sendStatusChangeNotification(user, status, reason);
    }

    // Log action
    await AdminLog.create({
      adminId: req.admin.id,
      action: 'USER_STATUS_CHANGE',
      targetUserId: userId,
      details: { status, reason }
    });

    res.json({
      success: true,
      data: {
        userId: user._id,
        newStatus: user.status,
        updatedAt: user.updatedAt
      },
      message: `User status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Delete User Account

```typescript
// DELETE /api/admin/users/:userId
interface DeleteUserRequest {
  reason: string;
  permanent?: boolean; // soft delete vs hard delete
}

interface DeleteUserResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    deletedAt: string;
  };
}
```

---

## 📈 Analytics APIs

### Get Revenue Analytics

```typescript
// GET /api/admin/analytics/revenue?period=6months
interface RevenueAnalyticsResponse {
  success: boolean;
  data: {
    overview: {
      total: number;
      growth: number;
      currency: string;
    };
    monthlyData: Array<{
      month: string;
      revenue: number;
      users: number;
    }>;
    breakdown: {
      providerServices: { amount: number; percentage: number };
      vendorSales: { amount: number; percentage: number };
      platformFees: { amount: number; percentage: number };
      sponsorships: { amount: number; percentage: number };
    };
  };
}
```

**Implementation:**

```javascript
router.get('/analytics/revenue', verifyAdminAuth, async (req, res) => {
  try {
    const { period = '6months' } = req.query;

    const startDate = getStartDate(period);

    // Get monthly revenue data
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get breakdown by source
    const breakdown = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      success: true,
      data: {
        overview: {
          total,
          growth: 23,
          currency: 'USD'
        },
        monthlyData: monthlyRevenue.map(item => ({
          month: getMonthName(item._id.month),
          revenue: item.revenue,
          users: item.count
        })),
        breakdown: formatBreakdown(breakdown, total)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Get User Growth Analytics

```typescript
// GET /api/admin/analytics/users?period=monthly
interface UserGrowthResponse {
  success: boolean;
  data: {
    total: number;
    growth: number;
    weeklyData: Array<{
      week: string;
      patients: number;
      providers: number;
      vendors: number;
      sponsors: number;
    }>;
    distribution: {
      patients: { count: number; percentage: number };
      providers: { count: number; percentage: number };
      vendors: { count: number; percentage: number };
      sponsors: { count: number; percentage: number };
    };
  };
}
```

### Get Top Performers

```typescript
// GET /api/admin/analytics/top-performers?type=provider&limit=10
interface TopPerformersResponse {
  success: boolean;
  data: {
    providers: Array<{
      id: string;
      name: string;
      revenue: number;
      appointments: number;
      rating: number;
    }>;
    vendors: Array<{
      id: string;
      name: string;
      revenue: number;
      orders: number;
      rating: number;
    }>;
  };
}
```

### Get Platform Metrics

```typescript
// GET /api/admin/analytics/metrics
interface PlatformMetricsResponse {
  success: boolean;
  data: {
    sessionDuration: {
      average: string; // "12m 34s"
      change: number;
      trend: 'up' | 'down';
    };
    bounceRate: {
      value: number;
      change: number;
      trend: 'up' | 'down';
    };
    conversionRate: {
      value: number;
      change: number;
      trend: 'up' | 'down';
    };
    satisfaction: {
      score: number;
      outOf: number;
      change: number;
      trend: 'up' | 'down';
    };
  };
}
```

### Get Geographic Distribution

```typescript
// GET /api/admin/analytics/geographic
interface GeographicResponse {
  success: boolean;
  data: {
    regions: Array<{
      name: string;
      users: number;
      revenue: number;
      percentage: number;
    }>;
  };
}
```

---

## 💰 Transaction APIs

### List Transactions

```typescript
// GET /api/admin/transactions?page=1&limit=10&type=all&status=all
interface ListTransactionsRequest {
  page?: number;
  limit?: number;
  type?: 'all' | 'appointment' | 'product' | 'sponsorship' | 'withdrawal' | 'deposit' | 'refund';
  status?: 'all' | 'completed' | 'pending' | 'failed' | 'refunded';
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface ListTransactionsResponse {
  success: boolean;
  data: {
    transactions: Array<{
      id: string;
      transactionId: string;
      type: string;
      from: {
        id: string;
        name: string;
        type: string;
      };
      to: {
        id: string;
        name: string;
        type: string;
      };
      amount: number;
      fee: number;
      status: string;
      date: string;
      method: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTransactions: number;
    };
    summary: {
      totalVolume: number;
      totalFees: number;
      completedCount: number;
      pendingCount: number;
      failedCount: number;
    };
  };
}
```

**Implementation:**

```javascript
router.get('/transactions', verifyAdminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type = 'all',
      status = 'all',
      search = '',
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};

    if (type !== 'all') query.type = type;
    if (status !== 'all') query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.transactionId = { $regex: search, $options: 'i' };
    }

    // Count and fetch
    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .populate('fromUserId', 'profile.firstName profile.lastName userType')
        .populate('toUserId', 'profile.firstName profile.lastName userType')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean()
    ]);

    // Calculate summary
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFee: { $sum: '$fee' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(formatTransaction),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total
        },
        summary: formatSummary(summary)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Get Transaction Details

```typescript
// GET /api/admin/transactions/:transactionId
interface TransactionDetailsResponse {
  success: boolean;
  data: {
    id: string;
    transactionId: string;
    type: string;
    status: string;
    amount: number;
    fee: number;
    netAmount: number;
    from: {
      id: string;
      name: string;
      type: string;
      email: string;
    };
    to: {
      id: string;
      name: string;
      type: string;
      email: string;
    };
    paymentMethod: string;
    createdAt: string;
    completedAt?: string;
    metadata?: object;
  };
}
```

### Process Refund

```typescript
// POST /api/admin/transactions/:transactionId/refund
interface RefundRequest {
  amount?: number; // partial refund if specified
  reason: string;
  notifyUser?: boolean;
}

interface RefundResponse {
  success: boolean;
  data: {
    refundId: string;
    originalTransactionId: string;
    amount: number;
    status: string;
  };
  message: string;
}
```

**Implementation:**

```javascript
router.post('/transactions/:transactionId/refund',
  verifyAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { amount, reason, notifyUser = true } = req.body;

      // Get original transaction
      const transaction = await Transaction.findOne({
        transactionId
      }).populate('fromUserId toUserId');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only completed transactions can be refunded'
        });
      }

      // Create refund transaction
      const refundAmount = amount || transaction.amount;

      const refund = await Transaction.create({
        transactionId: generateTransactionId('REFUND'),
        type: 'refund',
        fromUserId: transaction.toUserId,
        toUserId: transaction.fromUserId,
        amount: refundAmount,
        fee: 0,
        status: 'processing',
        originalTransactionId: transaction._id,
        metadata: {
          reason,
          processedBy: req.admin.id,
          processedAt: new Date()
        }
      });

      // Update original transaction
      transaction.status = 'refunded';
      transaction.refundId = refund._id;
      await transaction.save();

      // Process refund through payment gateway
      await processRefundWithGateway(refund);

      // Send notifications
      if (notifyUser) {
        await sendRefundNotification(transaction.fromUserId, refund);
      }

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'REFUND_PROCESSED',
        targetTransactionId: transaction._id,
        details: { refundAmount, reason }
      });

      res.json({
        success: true,
        data: {
          refundId: refund.transactionId,
          originalTransactionId: transaction.transactionId,
          amount: refundAmount,
          status: refund.status
        },
        message: 'Refund processed successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});
```

---

## ✅ Approval APIs

### List Pending Approvals

```typescript
// GET /api/admin/approvals?type=all&priority=all
interface ListApprovalsRequest {
  type?: 'all' | 'provider' | 'vendor' | 'sponsor' | 'product';
  priority?: 'all' | 'high' | 'medium' | 'low';
  page?: number;
  limit?: number;
}

interface ListApprovalsResponse {
  success: boolean;
  data: {
    approvals: Array<{
      id: string;
      type: 'provider' | 'vendor' | 'sponsor' | 'product';
      applicant: {
        name: string;
        email: string;
        phone?: string;
      };
      priority: 'high' | 'medium' | 'low';
      status: 'pending';
      requestDate: string;
      details: object;
      documents: string[];
    }>;
    summary: {
      total: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}
```

### Get Approval Details

```typescript
// GET /api/admin/approvals/:approvalId
interface ApprovalDetailsResponse {
  success: boolean;
  data: {
    id: string;
    type: string;
    status: string;
    priority: string;
    applicant: {
      name: string;
      email: string;
      phone: string;
    };
    submittedAt: string;
    details: {
      // Type-specific fields
      licenseNumber?: string;
      specialization?: string;
      businessLicense?: string;
      organizationType?: string;
      // etc.
    };
    documents: Array<{
      name: string;
      url: string;
      type: string;
      uploadedAt: string;
    }>;
    history: Array<{
      action: string;
      performedBy: string;
      timestamp: string;
      notes?: string;
    }>;
  };
}
```

### Approve Application

```typescript
// POST /api/admin/approvals/:approvalId/approve
interface ApproveRequest {
  notes?: string;
  notifyApplicant?: boolean;
}

interface ApproveResponse {
  success: boolean;
  data: {
    approvalId: string;
    userId: string;
    approvedAt: string;
  };
  message: string;
}
```

**Implementation:**

```javascript
router.post('/approvals/:approvalId/approve',
  verifyAdminAuth,
  async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { notes, notifyApplicant = true } = req.body;

      const approval = await Approval.findById(approvalId)
        .populate('userId');

      if (!approval) {
        return res.status(404).json({
          success: false,
          message: 'Approval request not found'
        });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'This application has already been processed'
        });
      }

      // Update approval status
      approval.status = 'approved';
      approval.approvedBy = req.admin.id;
      approval.approvedAt = new Date();
      approval.notes = notes;
      await approval.save();

      // Update user account based on type
      const user = await User.findById(approval.userId);
      user.status = 'active';

      // Add type-specific data
      if (approval.type === 'provider') {
        user.verifiedProvider = true;
        user.verificationDate = new Date();
      } else if (approval.type === 'vendor') {
        user.verifiedVendor = true;
        user.verificationDate = new Date();
      }

      await user.save();

      // Send notification
      if (notifyApplicant) {
        await sendApprovalNotification(user, approval.type);
      }

      // Log action
      await AdminLog.create({
        adminId: req.admin.id,
        action: 'APPROVAL_GRANTED',
        targetUserId: user._id,
        details: { type: approval.type, notes }
      });

      res.json({
        success: true,
        data: {
          approvalId: approval._id,
          userId: user._id,
          approvedAt: approval.approvedAt
        },
        message: 'Application approved successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});
```

### Reject Application

```typescript
// POST /api/admin/approvals/:approvalId/reject
interface RejectRequest {
  reason: string;
  notifyApplicant?: boolean;
}

interface RejectResponse {
  success: boolean;
  message: string;
}
```

---

## 🏥 HMO Plans Management APIs

### List All HMO Plans

```typescript
// GET /api/super-admin/hmo-plans?page=1&limit=20&status=all&category=all&planType=all&search=query
interface ListHMOPlansRequest {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive' | 'suspended' | 'discontinued';
  category?: 'all' | 'basic' | 'standard' | 'premium' | 'platinum';
  planType?: 'all' | 'individual' | 'family' | 'corporate' | 'group';
  search?: string; // searches name, plan code, provider name, description
  isAvailableForNewEnrollment?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListHMOPlansResponse {
  success: boolean;
  data: {
    plans: Array<{
      _id: string;
      name: string;
      planCode: string;
      description: string;
      provider: {
        name: string;
        email: string;
        phone: string;
        contactPerson?: string;
        website?: string;
      };
      planType: 'individual' | 'family' | 'corporate' | 'group';
      category: 'basic' | 'standard' | 'premium' | 'platinum';
      pricing: {
        monthlyPremium: {
          individual: number;
          family?: number;
          corporate?: number;
        };
        annualPremium: {
          individual: number;
          family?: number;
          corporate?: number;
        };
        currency: string;
      };
      status: string;
      isAvailableForNewEnrollment: boolean;
      statistics: {
        totalEnrollments: number;
        activeMembers: number;
        totalClaimsPaid: number;
        totalClaimsAmount: number;
      };
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalPlans: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      total: number;
      active: number;
      inactive: number;
      suspended: number;
      discontinued: number;
    };
  };
}
```

**Implementation:**

```javascript
// routes/admin/hmoPlans.js
router.get('/hmo-plans', verifyAdminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      category = 'all',
      planType = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isAvailableForNewEnrollment
    } = req.query;

    // Build query
    const query = {};

    if (status !== 'all') query.status = status;
    if (category !== 'all') query.category = category;
    if (planType !== 'all') query.planType = planType;
    if (isAvailableForNewEnrollment !== undefined) {
      query.isAvailableForNewEnrollment = isAvailableForNewEnrollment === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { planCode: { $regex: search, $options: 'i' } },
        { 'provider.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total
    const total = await HMOPlan.countDocuments(query);

    // Fetch plans
    const plans = await HMOPlan.find(query)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('lastModifiedBy', 'profile.firstName profile.lastName email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get summary
    const summary = await HMOPlan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        plans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPlans: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: {
          total,
          active: summary.find(s => s._id === 'active')?.count || 0,
          inactive: summary.find(s => s._id === 'inactive')?.count || 0,
          suspended: summary.find(s => s._id === 'suspended')?.count || 0,
          discontinued: summary.find(s => s._id === 'discontinued')?.count || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Get HMO Plan Details

```typescript
// GET /api/super-admin/hmo-plans/:id
interface HMOPlanDetailsResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    planCode: string;
    description: string;
    provider: {
      name: string;
      contactPerson: string;
      email: string;
      phone: string;
      address: object;
      website: string;
      licenseNumber: string;
    };
    planType: string;
    category: string;
    coverage: {
      outpatientCare: CoverageDetails;
      inpatientCare: CoverageDetails;
      emergencyCare: CoverageDetails;
      surgery: CoverageDetails;
      maternityAndChildbirth: CoverageDetails;
      prescriptionDrugs: CoverageDetails;
      diagnosticTests: CoverageDetails;
      dentalCare: CoverageDetails;
      visionCare: CoverageDetails;
      mentalHealth: CoverageDetails;
      preventiveCare: CoverageDetails;
      specialistConsultation: CoverageDetails;
    };
    pricing: {
      monthlyPremium: object;
      annualPremium: object;
      registrationFee: number;
      deductible: object;
      maxOutOfPocket: object;
      currency: string;
    };
    limits: {
      annualMaximum: number;
      lifetimeMaximum: number;
      dependentsAllowed: number;
      ageLimit: { min: number; max: number };
    };
    exclusions: Array<{ category: string; description: string }>;
    network: {
      type: string;
      providers: Array<object>;
      hospitals: string[];
      pharmacies: string[];
      clinics: string[];
    };
    enrollment: {
      openEnrollment: { startDate: Date; endDate: Date };
      minimumMembers: number;
      autoRenewal: boolean;
      gracePeriod: number;
    };
    status: string;
    isAvailableForNewEnrollment: boolean;
    statistics: {
      totalEnrollments: number;
      activeMembers: number;
      totalClaimsPaid: number;
      totalClaimsAmount: number;
      averageClaimProcessingTime: number;
      customerSatisfactionRating: number;
    };
    documents: Array<object>;
    keyBenefits: string[];
    additionalBenefits: Array<object>;
    createdBy: object;
    lastModifiedBy: object;
    createdAt: string;
    updatedAt: string;
  };
}

interface CoverageDetails {
  covered: boolean;
  copayment?: number;
  coveragePercentage?: number;
  requiresReferral?: boolean;
  limit?: {
    amount: number;
    period: string;
  };
}
```

### Create HMO Plan

```typescript
// POST /api/super-admin/hmo-plans
interface CreateHMOPlanRequest {
  name: string;
  planCode: string;
  description: string;
  provider: {
    name: string;
    email: string;
    phone: string;
    contactPerson?: string;
    address?: object;
    website?: string;
    licenseNumber?: string;
  };
  planType: 'individual' | 'family' | 'corporate' | 'group';
  category: 'basic' | 'standard' | 'premium' | 'platinum';
  coverage?: object;
  pricing: {
    monthlyPremium: {
      individual: number;
      family?: number;
      corporate?: number;
    };
    registrationFee?: number;
    deductible?: object;
    maxOutOfPocket?: object;
    currency?: string;
  };
  limits?: object;
  exclusions?: Array<object>;
  network?: object;
  enrollment?: object;
  status?: string;
  isAvailableForNewEnrollment?: boolean;
  documents?: Array<object>;
  keyBenefits?: string[];
  additionalBenefits?: Array<object>;
}

interface CreateHMOPlanResponse {
  success: boolean;
  data: object;
  message: string;
}
```

**Implementation:**

```javascript
router.post('/hmo-plans', verifyAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const planData = req.body;

    // Check if plan code already exists
    const existingPlan = await HMOPlan.findOne({
      planCode: planData.planCode.toUpperCase()
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'HMO plan with this code already exists'
      });
    }

    // Add admin who created the plan
    planData.createdBy = req.admin._id;
    planData.lastModifiedBy = req.admin._id;

    const hmoPlan = await HMOPlan.create(planData);

    // Log action
    await AdminLog.create({
      adminId: req.admin._id,
      action: 'CREATE_HMO_PLAN',
      targetResourceId: hmoPlan._id,
      details: { planCode: hmoPlan.planCode, planName: hmoPlan.name }
    });

    res.status(201).json({
      success: true,
      data: hmoPlan,
      message: 'HMO plan created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Update HMO Plan

```typescript
// PUT /api/super-admin/hmo-plans/:id
interface UpdateHMOPlanRequest {
  // Any fields from CreateHMOPlanRequest
  [key: string]: any;
}

interface UpdateHMOPlanResponse {
  success: boolean;
  data: object;
  message: string;
}
```

### Update HMO Plan Status

```typescript
// PATCH /api/super-admin/hmo-plans/:id/status
interface UpdateHMOPlanStatusRequest {
  status: 'active' | 'inactive' | 'suspended' | 'discontinued';
  reason?: string;
}

interface UpdateHMOPlanStatusResponse {
  success: boolean;
  data: {
    planId: string;
    newStatus: string;
    updatedAt: string;
  };
  message: string;
}
```

**Implementation:**

```javascript
router.patch('/hmo-plans/:id/status',
  verifyAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // Validate status
      const validStatuses = ['active', 'inactive', 'suspended', 'discontinued'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const hmoPlan = await HMOPlan.findById(id);

      if (!hmoPlan) {
        return res.status(404).json({
          success: false,
          message: 'HMO plan not found'
        });
      }

      hmoPlan.status = status;
      hmoPlan.lastModifiedBy = req.admin._id;

      // Add note about status change
      if (reason) {
        hmoPlan.internalNotes = `${hmoPlan.internalNotes || ''}\n[${new Date().toISOString()}] Status changed to ${status}. Reason: ${reason}`;
      }

      // If discontinued or suspended, make unavailable for new enrollment
      if (status === 'discontinued' || status === 'suspended') {
        hmoPlan.isAvailableForNewEnrollment = false;
      }

      await hmoPlan.save();

      // Log action
      await AdminLog.create({
        adminId: req.admin._id,
        action: 'UPDATE_HMO_PLAN_STATUS',
        targetResourceId: hmoPlan._id,
        details: { newStatus: status, reason }
      });

      res.json({
        success: true,
        data: {
          planId: hmoPlan._id,
          newStatus: hmoPlan.status,
          updatedAt: hmoPlan.updatedAt
        },
        message: `HMO plan status updated to ${status}`
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});
```

### Delete HMO Plan

```typescript
// DELETE /api/super-admin/hmo-plans/:id
interface DeleteHMOPlanRequest {
  permanent?: boolean; // true for hard delete, false for soft delete
}

interface DeleteHMOPlanResponse {
  success: boolean;
  message: string;
  data: {
    planId: string;
    deletedAt?: string;
    status?: string;
  };
}
```

### Get HMO Plan Statistics

```typescript
// GET /api/super-admin/hmo-plans/stats/overview
interface HMOPlanStatisticsResponse {
  success: boolean;
  data: {
    overview: {
      totalPlans: number;
      activePlans: number;
      totalEnrollments: number;
      totalActiveMembers: number;
      totalClaimsPaid: number;
      totalClaimsAmount: number;
    };
    distribution: {
      byCategory: Array<{
        _id: string;
        count: number;
        activeMembers: number;
      }>;
      byPlanType: Array<{
        _id: string;
        count: number;
        activeMembers: number;
      }>;
    };
    topPlans: Array<{
      name: string;
      planCode: string;
      statistics: {
        activeMembers: number;
        totalEnrollments: number;
      };
    }>;
  };
}
```

**Implementation:**

```javascript
router.get('/hmo-plans/stats/overview', verifyAdminAuth, async (req, res) => {
  try {
    // Get overall statistics
    const totalPlans = await HMOPlan.countDocuments();
    const activePlans = await HMOPlan.countDocuments({ status: 'active' });

    // Get enrollment statistics
    const enrollmentStats = await HMOPlan.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: '$statistics.totalEnrollments' },
          totalActiveMembers: { $sum: '$statistics.activeMembers' },
          totalClaimsPaid: { $sum: '$statistics.totalClaimsPaid' },
          totalClaimsAmount: { $sum: '$statistics.totalClaimsAmount' }
        }
      }
    ]);

    // Get distribution by category
    const categoryDistribution = await HMOPlan.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          activeMembers: { $sum: '$statistics.activeMembers' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get distribution by plan type
    const planTypeDistribution = await HMOPlan.aggregate([
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          activeMembers: { $sum: '$statistics.activeMembers' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get top plans
    const topPlans = await HMOPlan.find({ status: 'active' })
      .select('name planCode statistics.activeMembers statistics.totalEnrollments')
      .sort({ 'statistics.activeMembers': -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        overview: {
          totalPlans,
          activePlans,
          totalEnrollments: enrollmentStats[0]?.totalEnrollments || 0,
          totalActiveMembers: enrollmentStats[0]?.totalActiveMembers || 0,
          totalClaimsPaid: enrollmentStats[0]?.totalClaimsPaid || 0,
          totalClaimsAmount: enrollmentStats[0]?.totalClaimsAmount || 0
        },
        distribution: {
          byCategory: categoryDistribution,
          byPlanType: planTypeDistribution
        },
        topPlans
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Network Management

#### Add Provider to HMO Plan Network

```typescript
// POST /api/super-admin/hmo-plans/:id/network/providers
interface AddProviderToNetworkRequest {
  providerId: string;
  name: string;
  specialty: string;
  location: string;
}

interface AddProviderToNetworkResponse {
  success: boolean;
  data: Array<object>;
  message: string;
}
```

#### Remove Provider from HMO Plan Network

```typescript
// DELETE /api/super-admin/hmo-plans/:id/network/providers/:providerId
interface RemoveProviderFromNetworkResponse {
  success: boolean;
  data: Array<object>;
  message: string;
}
```

---

## 📝 System Logs APIs

### Get System Logs

```typescript
// GET /api/admin/logs?level=all&category=all&page=1&limit=10
interface SystemLogsRequest {
  level?: 'all' | 'error' | 'warning' | 'info' | 'success';
  category?: 'all' | 'auth' | 'api' | 'database' | 'payment' | 'email' | 'system';
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface SystemLogsResponse {
  success: boolean;
  data: {
    logs: Array<{
      id: string;
      timestamp: string;
      level: 'error' | 'warning' | 'info' | 'success';
      category: string;
      message: string;
      details: string;
      user?: string;
      ip?: string;
    }>;
    summary: {
      total: number;
      error: number;
      warning: number;
      info: number;
      success: number;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}
```

**Implementation:**

```javascript
router.get('/logs', verifyAdminAuth, async (req, res) => {
  try {
    const {
      level = 'all',
      category = 'all',
      search = '',
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    if (level !== 'all') query.level = level;
    if (category !== 'all') query.category = category;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch logs
    const [total, logs, summary] = await Promise.all([
      SystemLog.countDocuments(query),
      SystemLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      SystemLog.aggregate([
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        logs,
        summary: {
          total,
          error: summary.find(s => s._id === 'error')?.count || 0,
          warning: summary.find(s => s._id === 'warning')?.count || 0,
          info: summary.find(s => s._id === 'info')?.count || 0,
          success: summary.find(s => s._id === 'success')?.count || 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Get System Health Metrics

```typescript
// GET /api/admin/logs/system-health
interface SystemHealthMetricsResponse {
  success: boolean;
  data: {
    api: {
      uptime: number;
      responseTime: number;
      requestsPerMinute: number;
      status: 'healthy' | 'warning' | 'critical';
    };
    database: {
      uptime: number;
      connections: { active: number; max: number };
      queryTime: number;
      status: 'healthy' | 'warning' | 'critical';
    };
    errorRate: {
      rate: number;
      last24Hours: number;
      status: 'healthy' | 'warning' | 'critical';
    };
  };
}
```

---

## ⚙️ Settings APIs

### Get Platform Settings

```typescript
// GET /api/admin/settings
interface GetSettingsResponse {
  success: boolean;
  data: {
    general: {
      platformName: string;
      description: string;
      contactEmail: string;
      supportPhone: string;
      timezone: string;
      currency: string;
      dateFormat: string;
      language: string;
    };
    registration: {
      allowPatientRegistration: boolean;
      requireProviderVerification: boolean;
      requireVendorApproval: boolean;
    };
    security: {
      requireTwoFactor: boolean;
      sessionTimeout: number;
      passwordMinLength: number;
      requireSpecialChars: boolean;
    };
    notifications: {
      newUserRegistration: boolean;
      paymentFailures: boolean;
      systemErrors: boolean;
      adminEmails: string[];
    };
    payment: {
      processor: string;
      platformFeePercentage: number;
      minTransactionAmount: number;
      maxTransactionAmount: number;
    };
  };
}
```

### Update Platform Settings

```typescript
// PUT /api/admin/settings
interface UpdateSettingsRequest {
  section: 'general' | 'registration' | 'security' | 'notifications' | 'payment';
  data: object;
}

interface UpdateSettingsResponse {
  success: boolean;
  data: object;
  message: string;
}
```

**Implementation:**

```javascript
router.put('/settings', verifyAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { section, data } = req.body;

    // Validate section
    const validSections = ['general', 'registration', 'security', 'notifications', 'payment'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }

    // Get existing settings
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
    }

    // Update section
    settings[section] = { ...settings[section], ...data };
    settings.lastUpdatedBy = req.admin.id;
    settings.lastUpdatedAt = new Date();
    await settings.save();

    // Log change
    await AdminLog.create({
      adminId: req.admin.id,
      action: 'SETTINGS_UPDATED',
      details: { section, changes: data }
    });

    res.json({
      success: true,
      data: settings[section],
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 🗄️ Database Schema

### Admin User Schema

```javascript
const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String
  }],
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  lastLoginAt: Date,
  lastLoginIp: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

### Approval Schema

```javascript
const ApprovalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['provider', 'vendor', 'sponsor', 'product'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }],
  notes: String,
  history: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    timestamp: Date,
    notes: String
  }]
});
```

### System Log Schema

```javascript
const SystemLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  level: {
    type: String,
    enum: ['error', 'warning', 'info', 'success'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['auth', 'api', 'database', 'payment', 'email', 'system'],
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  details: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ip: String,
  userAgent: String,
  stack: String,
  metadata: mongoose.Schema.Types.Mixed
});

// Create TTL index for auto-deletion after 90 days
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
```

### Admin Log Schema

```javascript
const AdminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_STATUS_CHANGE',
      'USER_DELETED',
      'APPROVAL_GRANTED',
      'APPROVAL_REJECTED',
      'SETTINGS_UPDATED',
      'REFUND_PROCESSED',
      'LOGIN',
      'LOGOUT'
    ]
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});
```

### HMO Plan Schema

```javascript
const HMOPlanSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  planCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },

  // Provider Details
  provider: {
    name: { type: String, required: true },
    contactPerson: String,
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    website: String,
    licenseNumber: String
  },

  // Plan Details
  planType: {
    type: String,
    enum: ['individual', 'family', 'corporate', 'group'],
    required: true
  },
  category: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'platinum'],
    required: true
  },

  // Coverage Information (comprehensive medical services coverage)
  coverage: {
    outpatientCare: {
      covered: Boolean,
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: String
      }
    },
    inpatientCare: { /* similar structure */ },
    emergencyCare: { /* similar structure */ },
    surgery: { /* similar structure */ },
    maternityAndChildbirth: { /* similar structure */ },
    prescriptionDrugs: { /* similar structure */ },
    diagnosticTests: { /* similar structure */ },
    dentalCare: { /* similar structure */ },
    visionCare: { /* similar structure */ },
    mentalHealth: { /* similar structure */ },
    preventiveCare: { /* similar structure */ },
    specialistConsultation: {
      covered: Boolean,
      copayment: Number,
      coveragePercentage: Number,
      requiresReferral: Boolean,
      limit: {
        amount: Number,
        period: String
      }
    }
  },

  // Financial Details
  pricing: {
    monthlyPremium: {
      individual: { type: Number, required: true },
      family: Number,
      corporate: Number
    },
    annualPremium: {
      individual: Number,
      family: Number,
      corporate: Number
    },
    registrationFee: Number,
    deductible: {
      individual: Number,
      family: Number
    },
    maxOutOfPocket: {
      individual: Number,
      family: Number
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Plan Limits
  limits: {
    annualMaximum: Number,
    lifetimeMaximum: Number,
    dependentsAllowed: Number,
    ageLimit: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 }
    }
  },

  // Network Information
  network: {
    type: { type: String, enum: ['PPO', 'HMO', 'EPO', 'POS'] },
    providers: [{
      providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      specialty: String,
      location: String
    }],
    hospitals: [String],
    pharmacies: [String],
    clinics: [String]
  },

  // Enrollment Details
  enrollment: {
    openEnrollment: {
      startDate: Date,
      endDate: Date
    },
    minimumMembers: Number,
    autoRenewal: Boolean,
    gracePeriod: Number
  },

  // Plan Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'discontinued'],
    default: 'active'
  },
  isAvailableForNewEnrollment: {
    type: Boolean,
    default: true
  },

  // Statistics
  statistics: {
    totalEnrollments: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    totalClaimsPaid: { type: Number, default: 0 },
    totalClaimsAmount: { type: Number, default: 0 },
    averageClaimProcessingTime: Number,
    customerSatisfactionRating: Number
  },

  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  internalNotes: String
}, {
  timestamps: true
});

// Indexes
HMOPlanSchema.index({ planCode: 1 });
HMOPlanSchema.index({ status: 1, isAvailableForNewEnrollment: 1 });
HMOPlanSchema.index({ 'provider.name': 1 });
HMOPlanSchema.index({ category: 1, planType: 1 });
```

### Platform Settings Schema

```javascript
const PlatformSettingsSchema = new mongoose.Schema({
  general: {
    platformName: { type: String, default: 'Àñola Health' },
    description: String,
    contactEmail: String,
    supportPhone: String,
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    language: { type: String, default: 'en' }
  },
  registration: {
    allowPatientRegistration: { type: Boolean, default: true },
    requireProviderVerification: { type: Boolean, default: true },
    requireVendorApproval: { type: Boolean, default: true }
  },
  security: {
    requireTwoFactor: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 },
    passwordMinLength: { type: Number, default: 8 },
    requireSpecialChars: { type: Boolean, default: true }
  },
  notifications: {
    newUserRegistration: { type: Boolean, default: true },
    paymentFailures: { type: Boolean, default: true },
    systemErrors: { type: Boolean, default: true },
    adminEmails: [String]
  },
  payment: {
    processor: { type: String, default: 'stripe' },
    platformFeePercentage: { type: Number, default: 5 },
    minTransactionAmount: { type: Number, default: 1 },
    maxTransactionAmount: { type: Number, default: 10000 }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastUpdatedAt: Date
});
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  details?: object;
}
```

### Common Error Codes

```javascript
const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

  // Validation
  VALIDATION_ERROR: 'Validation error',
  INVALID_INPUT: 'Invalid input data',

  // Resources
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',

  // Operations
  OPERATION_FAILED: 'Operation failed',
  ALREADY_PROCESSED: 'Already processed',

  // System
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error'
};
```

### Error Handler Middleware

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorCode: 'VALIDATION_ERROR',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errorCode: 'ALREADY_EXISTS',
      details: err.keyValue
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      errorCode: 'INVALID_TOKEN'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errorCode: err.code || 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
```

---

## 💻 Implementation Examples

### Complete Express Server Setup

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Admin routes
app.use('/api/admin', require('./routes/admin'));

// Error handling
app.use(require('./middleware/errorHandler'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Admin API server running on port ${PORT}`);
});
```

### Admin Routes Index

```javascript
// routes/admin/index.js
const express = require('express');
const router = express.Router();

const { verifyAdminAuth, requireSuperAdmin } = require('../../middleware/adminAuth');

// Import route modules
const dashboardRoutes = require('./dashboard');
const userRoutes = require('./users');
const analyticsRoutes = require('./analytics');
const transactionRoutes = require('./transactions');
const approvalRoutes = require('./approvals');
const logRoutes = require('./logs');
const settingsRoutes = require('./settings');

// Mount routes
router.use('/dashboard', verifyAdminAuth, dashboardRoutes);
router.use('/users', verifyAdminAuth, userRoutes);
router.use('/analytics', verifyAdminAuth, analyticsRoutes);
router.use('/transactions', verifyAdminAuth, transactionRoutes);
router.use('/approvals', verifyAdminAuth, approvalRoutes);
router.use('/logs', verifyAdminAuth, logRoutes);
router.use('/settings', verifyAdminAuth, requireSuperAdmin, settingsRoutes);

module.exports = router;
```

### Frontend API Integration Example

```typescript
// lib/api/admin.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
            refreshToken
          });
          localStorage.setItem('admin_access_token', response.data.accessToken);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => adminApi.get('/dashboard/stats'),
  getUserDistribution: () => adminApi.get('/dashboard/user-distribution'),
  getRecentActivity: (limit = 10) => adminApi.get(`/dashboard/activity?limit=${limit}`),

  // Users
  getUsers: (params) => adminApi.get('/users', { params }),
  getUserDetails: (userId) => adminApi.get(`/users/${userId}`),
  updateUserStatus: (userId, data) => adminApi.put(`/users/${userId}/status`, data),
  deleteUser: (userId, data) => adminApi.delete(`/users/${userId}`, { data }),

  // Analytics
  getRevenueAnalytics: (period) => adminApi.get(`/analytics/revenue?period=${period}`),
  getUserGrowth: (period) => adminApi.get(`/analytics/users?period=${period}`),
  getTopPerformers: (type, limit) => adminApi.get(`/analytics/top-performers?type=${type}&limit=${limit}`),

  // Transactions
  getTransactions: (params) => adminApi.get('/transactions', { params }),
  getTransactionDetails: (txnId) => adminApi.get(`/transactions/${txnId}`),
  processRefund: (txnId, data) => adminApi.post(`/transactions/${txnId}/refund`, data),

  // Approvals
  getApprovals: (params) => adminApi.get('/approvals', { params }),
  getApprovalDetails: (approvalId) => adminApi.get(`/approvals/${approvalId}`),
  approveApplication: (approvalId, data) => adminApi.post(`/approvals/${approvalId}/approve`, data),
  rejectApplication: (approvalId, data) => adminApi.post(`/approvals/${approvalId}/reject`, data),

  // Logs
  getSystemLogs: (params) => adminApi.get('/logs', { params }),
  getSystemHealth: () => adminApi.get('/logs/system-health'),

  // Settings
  getSettings: () => adminApi.get('/settings'),
  updateSettings: (data) => adminApi.put('/settings', data)
};
```

### React Hook Example

```typescript
// hooks/useAdminData.ts
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api/admin';

export function useAdminDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardStats();
        setStats(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
```

---

## 🔒 Security Best Practices

### 1. Authentication
- Use strong JWT secrets (at least 256 bits)
- Implement token rotation
- Set appropriate token expiration times
- Use HTTP-only cookies for refresh tokens

### 2. Authorization
- Implement role-based access control (RBAC)
- Check permissions on every request
- Log all admin actions
- Implement IP whitelisting for super admins

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/admin', adminLimiter);
```

### 4. Input Validation
```javascript
const { body, validationResult } = require('express-validator');

router.post('/users/:userId/status',
  [
    body('status').isIn(['active', 'inactive', 'suspended']),
    body('reason').optional().isString().trim(),
    body('notifyUser').optional().isBoolean()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  },
  updateUserStatusHandler
);
```

### 5. Audit Logging
- Log all admin actions
- Include: who, what, when, where (IP)
- Store logs securely
- Implement log retention policies

---

## 📝 Testing

### Unit Test Example

```javascript
// tests/admin/users.test.js
const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Admin User Management', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin
    const response = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@anola.health',
        password: 'admin123'
      });
    adminToken = response.body.data.tokens.accessToken;
  });

  test('should get list of users', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.users)).toBe(true);
  });

  test('should update user status', async () => {
    const user = await User.findOne({ userType: 'patient' });

    const response = await request(app)
      .put(`/api/admin/users/${user._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'suspended',
        reason: 'Test suspension'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.newStatus).toBe('suspended');
  });
});
```

---

## 📊 Performance Optimization

### 1. Database Indexing
```javascript
// Add indexes for frequently queried fields
UserSchema.index({ email: 1 });
UserSchema.index({ userType: 1, status: 1 });
UserSchema.index({ createdAt: -1 });

TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ fromUserId: 1, toUserId: 1 });

SystemLogSchema.index({ level: 1, category: 1, timestamp: -1 });
```

### 2. Caching
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache dashboard stats for 5 minutes
router.get('/dashboard/stats', async (req, res) => {
  const cacheKey = 'admin:dashboard:stats';

  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from database
  const stats = await fetchDashboardStats();

  // Cache result
  await client.setex(cacheKey, 300, JSON.stringify(stats));

  res.json(stats);
});
```

### 3. Pagination
Always implement pagination for list endpoints to avoid performance issues with large datasets.

---

## 🚀 Deployment Checklist

- [ ] Set strong JWT secrets in production
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database connection pooling
- [ ] Set up monitoring (e.g., PM2, New Relic)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Implement health check endpoint
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Enable database replication
- [ ] Configure load balancing (if needed)

---

## 📞 Support & Resources

### Documentation Links
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Environment Variables Template

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/anola-health
MONGODB_POOL_SIZE=10

# Admin JWT
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key-here
ADMIN_JWT_EXPIRES_IN=24h
ADMIN_REFRESH_SECRET=your-super-secret-refresh-key-here
ADMIN_REFRESH_EXPIRES_IN=7d

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@anola.health
SMTP_PASS=

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_RETENTION_DAYS=90
```

---

**Status:** Ready for Backend Implementation
**Version:** 1.0.0
**Last Updated:** January 2025

---

*This guide provides the complete backend API specification for the Super Admin Dashboard. All endpoints are designed to work seamlessly with the existing frontend implementation.*
