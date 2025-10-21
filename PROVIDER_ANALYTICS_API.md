# Provider Analytics API Documentation

## Overview

The Provider Analytics API provides comprehensive insights into a provider's performance, including appointment statistics, revenue tracking, patient analytics, and service performance metrics.

## Endpoint

```
GET /api/providers/{providerId}/analytics
```

**Authentication:** Required (Bearer Token)

**Base URL:** `https://anola-backend.vercel.app`

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| providerId | string | Yes | The unique identifier of the provider |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | string | No | month | Time period for analytics |

**Valid Period Values:**
- `day` - Last 24 hours
- `week` - Last 7 days
- `month` - Last 30 days
- `year` - Last 365 days
- `all` - All time data

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "period": "month",
  "startDate": "2025-09-21T09:00:00.000Z",
  "endDate": "2025-10-21T09:00:00.000Z",
  "analytics": {
    "appointments": {
      "total": 150,
      "scheduled": 45,
      "completed": 95,
      "cancelled": 8,
      "noShow": 2,
      "byMode": {
        "in-person": 80,
        "video": 45,
        "audio": 15,
        "chat": 10
      },
      "byType": {
        "consultation": 75,
        "follow-up": 40,
        "emergency": 10,
        "routine-checkup": 25
      }
    },
    "revenue": {
      "total": 4750000,
      "pending": 450000,
      "received": 4300000,
      "averagePerAppointment": 50000
    },
    "patients": {
      "total": 120,
      "new": 45,
      "returning": 75
    },
    "topServices": [
      {
        "serviceId": "SRV-ABC123",
        "name": "Initial Consultation",
        "price": 50000,
        "bookings": 45,
        "revenue": 2250000
      },
      {
        "serviceId": "SRV-DEF456",
        "name": "Follow-up Visit",
        "price": 30000,
        "bookings": 38,
        "revenue": 1140000
      }
    ],
    "dailyTrends": [
      {
        "date": "2025-10-01",
        "appointments": 5,
        "revenue": 250000
      },
      {
        "date": "2025-10-02",
        "appointments": 7,
        "revenue": 350000
      }
      // ... more daily data
    ],
    "performance": {
      "completionRate": "63.33",
      "cancellationRate": "5.33",
      "noShowRate": "1.33",
      "averageRating": 4.5,
      "totalReviews": 89
    }
  },
  "summary": {
    "totalAppointments": 150,
    "totalRevenue": 4750000,
    "totalPatients": 120,
    "averageRating": 4.5
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Provider not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to get analytics",
  "error": "Error details"
}
```

## Analytics Breakdown

### 1. Appointment Analytics

**Metrics Provided:**
- **Total Appointments** - All appointments in the period
- **Scheduled** - Future appointments
- **Completed** - Successfully completed appointments
- **Cancelled** - Appointments cancelled by either party
- **No Show** - Appointments where patient didn't attend

**Breakdown by Mode:**
- In-person visits
- Video consultations
- Audio calls
- Chat consultations

**Breakdown by Type:**
- Consultation
- Follow-up
- Emergency
- Routine checkup
- Vaccination
- Lab test
- Surgery
- Therapy

### 2. Revenue Analytics

**Metrics Provided:**
- **Total Revenue** - Sum of all completed appointment payments
- **Pending Payments** - Completed appointments with unpaid invoices
- **Received** - Actually received payments
- **Average Per Appointment** - Revenue divided by completed appointments

### 3. Patient Analytics

**Metrics Provided:**
- **Total Patients** - Unique patients seen in the period
- **New Patients** - Patients with only one appointment
- **Returning Patients** - Patients with multiple appointments

### 4. Top Services

Shows the top 5 performing services ranked by number of bookings:
- Service ID and name
- Price per service
- Total bookings
- Total revenue generated

### 5. Daily Trends

Daily breakdown of:
- Number of appointments each day
- Revenue generated each day
- Limited to last 30 days for performance

### 6. Performance Metrics

**Calculated Rates:**
- **Completion Rate** - Percentage of appointments completed
- **Cancellation Rate** - Percentage of appointments cancelled
- **No-Show Rate** - Percentage of appointments where patient didn't show
- **Average Rating** - Provider's overall rating
- **Total Reviews** - Number of patient reviews

## Use Cases

### 1. Dashboard Overview
```bash
curl -H "Authorization: Bearer {token}" \
  "https://anola-backend.vercel.app/api/providers/{providerId}/analytics?period=month"
```

Shows comprehensive monthly performance for the provider dashboard.

### 2. Daily Performance Check
```bash
curl -H "Authorization: Bearer {token}" \
  "https://anola-backend.vercel.app/api/providers/{providerId}/analytics?period=day"
```

Quick daily snapshot of appointments and revenue.

### 3. Weekly Report
```bash
curl -H "Authorization: Bearer {token}" \
  "https://anola-backend.vercel.app/api/providers/{providerId}/analytics?period=week"
```

Weekly performance review for staff meetings.

### 4. Annual Review
```bash
curl -H "Authorization: Bearer {token}" \
  "https://anola-backend.vercel.app/api/providers/{providerId}/analytics?period=year"
```

Yearly performance for tax reporting and planning.

### 5. Complete History
```bash
curl -H "Authorization: Bearer {token}" \
  "https://anola-backend.vercel.app/api/providers/{providerId}/analytics?period=all"
```

All-time statistics for the provider.

## Integration Examples

### React/TypeScript Component

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ProviderAnalytics {
  success: boolean;
  period: string;
  analytics: {
    appointments: {
      total: number;
      completed: number;
      cancelled: number;
    };
    revenue: {
      total: number;
      pending: number;
    };
    patients: {
      total: number;
      new: number;
    };
    performance: {
      completionRate: string;
      averageRating: number;
    };
  };
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalPatients: number;
    averageRating: number;
  };
}

const ProviderDashboard: React.FC<{ providerId: string }> = ({ providerId }) => {
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `https://anola-backend.vercel.app/api/providers/${providerId}/analytics`,
          {
            params: { period },
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [providerId, period]);

  if (loading) return <div>Loading analytics...</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <h1>Provider Analytics</h1>

      <div className="period-selector">
        <button onClick={() => setPeriod('day')}>Daily</button>
        <button onClick={() => setPeriod('week')}>Weekly</button>
        <button onClick={() => setPeriod('month')}>Monthly</button>
        <button onClick={() => setPeriod('year')}>Yearly</button>
      </div>

      <div className="summary-cards">
        <div className="card">
          <h3>Total Appointments</h3>
          <p>{analytics.summary.totalAppointments}</p>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <p>₦{analytics.summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Total Patients</h3>
          <p>{analytics.summary.totalPatients}</p>
        </div>
        <div className="card">
          <h3>Average Rating</h3>
          <p>{analytics.summary.averageRating.toFixed(1)} ⭐</p>
        </div>
      </div>

      <div className="detailed-analytics">
        <div className="appointments">
          <h3>Appointments</h3>
          <p>Completed: {analytics.analytics.appointments.completed}</p>
          <p>Cancelled: {analytics.analytics.appointments.cancelled}</p>
          <p>Completion Rate: {analytics.analytics.performance.completionRate}%</p>
        </div>

        <div className="revenue">
          <h3>Revenue</h3>
          <p>Total: ₦{analytics.analytics.revenue.total.toLocaleString()}</p>
          <p>Pending: ₦{analytics.analytics.revenue.pending.toLocaleString()}</p>
        </div>

        <div className="patients">
          <h3>Patients</h3>
          <p>New: {analytics.analytics.patients.new}</p>
          <p>Returning: {analytics.analytics.patients.total - analytics.analytics.patients.new}</p>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
```

### Node.js/Express Example

```javascript
const axios = require('axios');

async function getProviderAnalytics(providerId, period = 'month', accessToken) {
  try {
    const response = await axios.get(
      `https://anola-backend.vercel.app/api/providers/${providerId}/analytics`,
      {
        params: { period },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { analytics, summary } = response.data;

    console.log('=== Provider Analytics Summary ===');
    console.log(`Period: ${period}`);
    console.log(`Total Appointments: ${summary.totalAppointments}`);
    console.log(`Total Revenue: ₦${summary.totalRevenue.toLocaleString()}`);
    console.log(`Total Patients: ${summary.totalPatients}`);
    console.log(`Average Rating: ${summary.averageRating}/5`);
    console.log('');

    console.log('=== Performance Metrics ===');
    console.log(`Completion Rate: ${analytics.performance.completionRate}%`);
    console.log(`Cancellation Rate: ${analytics.performance.cancellationRate}%`);
    console.log(`No-Show Rate: ${analytics.performance.noShowRate}%`);

    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
getProviderAnalytics('68f69bda582a884e78e0b0e5', 'month', 'your-access-token-here');
```

## Best Practices

### 1. Caching
Cache analytics data for short periods (5-15 minutes) to reduce API calls:
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedAnalytics = null;
let cacheTimestamp = 0;

async function getCachedAnalytics(providerId, period) {
  const now = Date.now();
  if (cachedAnalytics && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedAnalytics;
  }

  cachedAnalytics = await fetchAnalytics(providerId, period);
  cacheTimestamp = now;
  return cachedAnalytics;
}
```

### 2. Error Handling
Always implement proper error handling:
```javascript
try {
  const analytics = await getAnalytics(providerId, period);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired - refresh or redirect to login
  } else if (error.response?.status === 404) {
    // Provider not found
  } else {
    // Other errors
  }
}
```

### 3. Data Visualization
Use the daily trends data for charts:
```javascript
// Chart.js example
const chartData = {
  labels: analytics.analytics.dailyTrends.map(d => d.date),
  datasets: [
    {
      label: 'Appointments',
      data: analytics.analytics.dailyTrends.map(d => d.appointments)
    },
    {
      label: 'Revenue',
      data: analytics.analytics.dailyTrends.map(d => d.revenue)
    }
  ]
};
```

### 4. Performance Optimization
For large date ranges, consider:
- Pagination for daily trends
- Aggregated data instead of raw data
- Background jobs for report generation

## Notes

- Analytics are calculated in real-time based on appointment data
- All revenue values are in the provider's default currency (NGN)
- Dates are returned in ISO 8601 format
- Daily trends are limited to 30 days for performance
- Completion/cancellation rates are percentages with 2 decimal places
- Top services are limited to 5 items, sorted by booking count

## Related Endpoints

- [GET /api/providers/{providerId}/profile](./PROVIDER_BACKEND_API_GUIDE.md#get-provider-profile) - Get provider profile
- [GET /api/providers/{providerId}/appointments](./PROVIDER_BACKEND_API_GUIDE.md#get-appointments) - Get appointments list
- [GET /api/providers/{providerId}/services](./PROVIDER_BACKEND_API_GUIDE.md#get-services) - Get services list

## Support

For issues or questions:
- Check the [main documentation](./README.md)
- Review [error codes](./ERROR_CODES.md)
- Contact support if needed
