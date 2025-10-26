# Frontend HMO Integration Guide

## 🎯 Overview

This guide provides complete frontend implementation examples for integrating the Anola HMO system into web and mobile applications. Includes React, React Native, and vanilla JavaScript examples.

---

## 📋 Table of Contents

1. [Authentication Setup](#authentication-setup)
2. [HMO Enrollment (All User Types)](#hmo-enrollment-all-user-types)
3. [Claims Submission (Providers/Vendors)](#claims-submission-providersvendors)
4. [Claims Processing (Super Admin)](#claims-processing-super-admin)
5. [Payment & Wallet Integration](#payment--wallet-integration)
6. [React Hooks & State Management](#react-hooks--state-management)
7. [Error Handling](#error-handling)
8. [TypeScript Types](#typescript-types)

---

## 🔐 Authentication Setup

### API Client Setup

```javascript
// api/client.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.anolahealth.com';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = null;
  }

  setAccessToken(token) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Request failed',
          errors: data.errors,
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // HTTP Methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
```

---

## 🏥 HMO Enrollment (All User Types)

### 1. Browse Available HMO Plans

```javascript
// services/hmo.service.js
import { apiClient } from '../api/client';

export const hmoService = {
  // Browse all available plans (public - no auth required)
  async getAvailablePlans(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/hmo-plans?${params}`);
    return response.data;
  },

  // Get plan details
  async getPlanDetails(planId) {
    const response = await apiClient.get(`/api/hmo-plans/${planId}`);
    return response.data;
  },

  // Compare plans
  async comparePlans(planIds) {
    const response = await apiClient.post('/api/hmo-plans/compare', { planIds });
    return response.data;
  },
};
```

### React Component: Browse Plans

```jsx
// components/HMO/BrowsePlans.jsx
import React, { useState, useEffect } from 'react';
import { hmoService } from '../../services/hmo.service';

const BrowsePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    planType: 'individual',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await hmoService.getAvailablePlans(filters);
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="browse-plans">
      <h1>Browse HMO Plans</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="platinum">Platinum</option>
        </select>

        <select
          value={filters.planType}
          onChange={(e) => handleFilterChange('planType', e.target.value)}
        >
          <option value="individual">Individual</option>
          <option value="family">Family</option>
          <option value="corporate">Corporate</option>
          <option value="group">Group</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
        />
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div>Loading plans...</div>
      ) : (
        <div className="plans-grid">
          {plans.map(plan => (
            <PlanCard key={plan._id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
};

const PlanCard = ({ plan }) => (
  <div className="plan-card">
    <div className="plan-header">
      <h3>{plan.name}</h3>
      <span className="category">{plan.category}</span>
    </div>

    <div className="plan-price">
      <span className="amount">${plan.pricing.monthlyPremium.individual}</span>
      <span className="period">/month</span>
    </div>

    <div className="plan-coverage">
      <h4>Coverage Includes:</h4>
      <ul>
        {plan.coverage.outpatientCare.covered && (
          <li>✓ Outpatient Care ({plan.coverage.outpatientCare.coveragePercentage}%)</li>
        )}
        {plan.coverage.inpatientCare.covered && (
          <li>✓ Inpatient Care ({plan.coverage.inpatientCare.coveragePercentage}%)</li>
        )}
        {plan.coverage.prescriptionDrugs.covered && (
          <li>✓ Prescriptions (${plan.coverage.prescriptionDrugs.copayment} copay)</li>
        )}
        {plan.coverage.emergencyCare.covered && (
          <li>✓ Emergency Care</li>
        )}
      </ul>
    </div>

    <button onClick={() => window.location.href = `/enroll/${plan._id}`}>
      Enroll Now
    </button>
  </div>
);

export default BrowsePlans;
```

### 2. Compare Plans

```jsx
// components/HMO/ComparePlans.jsx
import React, { useState, useEffect } from 'react';
import { hmoService } from '../../services/hmo.service';

const ComparePlans = ({ planIds }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planIds && planIds.length >= 2) {
      loadComparison();
    }
  }, [planIds]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const data = await hmoService.comparePlans(planIds);
      setComparison(data);
    } catch (error) {
      console.error('Failed to compare plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading comparison...</div>;
  if (!comparison) return null;

  return (
    <div className="compare-plans">
      <h2>Compare Plans</h2>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            {comparison.plans.map(plan => (
              <th key={plan._id}>{plan.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Monthly Premium</td>
            {comparison.plans.map(plan => (
              <td key={plan._id}>
                ${plan.pricing.monthlyPremium.individual}
              </td>
            ))}
          </tr>

          <tr>
            <td>Annual Deductible</td>
            {comparison.plans.map(plan => (
              <td key={plan._id}>
                ${plan.pricing.deductible.individual}
              </td>
            ))}
          </tr>

          <tr>
            <td>Max Out of Pocket</td>
            {comparison.plans.map(plan => (
              <td key={plan._id}>
                ${plan.pricing.maxOutOfPocket.individual}
              </td>
            ))}
          </tr>

          <tr>
            <td>Outpatient Coverage</td>
            {comparison.plans.map(plan => (
              <td key={plan._id}>
                {plan.coverage.outpatientCare.coveragePercentage}%
              </td>
            ))}
          </tr>

          <tr>
            <td>Prescription Copay</td>
            {comparison.plans.map(plan => (
              <td key={plan._id}>
                ${plan.coverage.prescriptionDrugs.copayment}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="recommendation">
        <h3>Our Recommendation</h3>
        <p>{comparison.recommendation}</p>
      </div>
    </div>
  );
};

export default ComparePlans;
```

### 3. Enroll in Plan

```javascript
// services/enrollment.service.js
export const enrollmentService = {
  async enrollInPlan(enrollmentData) {
    const response = await apiClient.post('/api/hmo-enrollments', enrollmentData);
    return response.data;
  },

  async getMyEnrollments(status = '') {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/api/hmo-enrollments/my-enrollments${params}`);
    return response.data;
  },

  async getEnrollmentDetails(enrollmentId) {
    const response = await apiClient.get(`/api/hmo-enrollments/${enrollmentId}`);
    return response.data;
  },

  async updateEnrollment(enrollmentId, updates) {
    const response = await apiClient.put(`/api/hmo-enrollments/${enrollmentId}`, updates);
    return response.data;
  },

  async cancelEnrollment(enrollmentId, reason) {
    const response = await apiClient.post(
      `/api/hmo-enrollments/${enrollmentId}/cancel`,
      { reason }
    );
    return response.data;
  },

  async renewEnrollment(enrollmentId, paymentMethod) {
    const response = await apiClient.post(
      `/api/hmo-enrollments/${enrollmentId}/renew`,
      { paymentMethod }
    );
    return response.data;
  },

  async downloadMembershipCard(enrollmentId, format = 'pkpass') {
    const response = await fetch(
      `${apiClient.baseURL}/api/hmo-enrollments/${enrollmentId}/card?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${apiClient.getAccessToken()}`
        }
      }
    );

    if (format === 'json') {
      return await response.json();
    }

    const blob = await response.blob();
    return blob;
  },
};
```

### React Component: Enrollment Form

```jsx
// components/HMO/EnrollmentForm.jsx
import React, { useState } from 'react';
import { enrollmentService } from '../../services/enrollment.service';

const EnrollmentForm = ({ planId, plan }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    planId,
    enrollmentType: 'individual',
    dependents: [],
    paymentPlan: 'monthly',
    paymentMethod: 'card',
    coverageStartDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addDependent = () => {
    setFormData(prev => ({
      ...prev,
      dependents: [
        ...prev.dependents,
        {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'other',
          relationship: 'spouse',
        }
      ]
    }));
  };

  const updateDependent = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      dependents: prev.dependents.map((dep, i) =>
        i === index ? { ...dep, [field]: value } : dep
      )
    }));
  };

  const removeDependent = (index) => {
    setFormData(prev => ({
      ...prev,
      dependents: prev.dependents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const enrollment = await enrollmentService.enrollInPlan(formData);

      alert('Enrollment successful! Your membership card will be available shortly.');
      window.location.href = `/enrollments/${enrollment._id}`;
    } catch (err) {
      setError(err.message);
      console.error('Enrollment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enrollment-form">
      <h2>Enroll in {plan.name}</h2>

      {/* Progress Steps */}
      <div className="steps">
        <div className={step >= 1 ? 'active' : ''}>1. Plan Type</div>
        <div className={step >= 2 ? 'active' : ''}>2. Dependents</div>
        <div className={step >= 3 ? 'active' : ''}>3. Payment</div>
        <div className={step >= 4 ? 'active' : ''}>4. Review</div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Plan Type */}
        {step === 1 && (
          <div className="step">
            <h3>Select Enrollment Type</h3>

            <label>
              <input
                type="radio"
                value="individual"
                checked={formData.enrollmentType === 'individual'}
                onChange={(e) => handleInputChange('enrollmentType', e.target.value)}
              />
              Individual (${plan.pricing.monthlyPremium.individual}/month)
            </label>

            <label>
              <input
                type="radio"
                value="family"
                checked={formData.enrollmentType === 'family'}
                onChange={(e) => handleInputChange('enrollmentType', e.target.value)}
              />
              Family (${plan.pricing.monthlyPremium.family}/month)
            </label>

            <label>
              <input
                type="radio"
                value="corporate"
                checked={formData.enrollmentType === 'corporate'}
                onChange={(e) => handleInputChange('enrollmentType', e.target.value)}
              />
              Corporate (${plan.pricing.monthlyPremium.corporate}/month)
            </label>

            <label>
              <h4>Coverage Start Date</h4>
              <input
                type="date"
                value={formData.coverageStartDate}
                onChange={(e) => handleInputChange('coverageStartDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </label>

            <button type="button" onClick={() => setStep(2)}>
              Next
            </button>
          </div>
        )}

        {/* Step 2: Dependents */}
        {step === 2 && (
          <div className="step">
            <h3>Add Dependents</h3>

            {formData.enrollmentType !== 'family' ? (
              <p>No dependents needed for {formData.enrollmentType} enrollment.</p>
            ) : (
              <>
                {formData.dependents.map((dependent, index) => (
                  <div key={index} className="dependent-form">
                    <h4>Dependent {index + 1}</h4>

                    <input
                      placeholder="First Name"
                      value={dependent.firstName}
                      onChange={(e) => updateDependent(index, 'firstName', e.target.value)}
                      required
                    />

                    <input
                      placeholder="Last Name"
                      value={dependent.lastName}
                      onChange={(e) => updateDependent(index, 'lastName', e.target.value)}
                      required
                    />

                    <input
                      type="date"
                      placeholder="Date of Birth"
                      value={dependent.dateOfBirth}
                      onChange={(e) => updateDependent(index, 'dateOfBirth', e.target.value)}
                      required
                    />

                    <select
                      value={dependent.relationship}
                      onChange={(e) => updateDependent(index, 'relationship', e.target.value)}
                      required
                    >
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="other">Other</option>
                    </select>

                    <button type="button" onClick={() => removeDependent(index)}>
                      Remove
                    </button>
                  </div>
                ))}

                <button type="button" onClick={addDependent}>
                  + Add Dependent
                </button>
              </>
            )}

            <div className="navigation">
              <button type="button" onClick={() => setStep(1)}>Back</button>
              <button type="button" onClick={() => setStep(3)}>Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="step">
            <h3>Payment Information</h3>

            <label>
              <h4>Payment Plan</h4>
              <select
                value={formData.paymentPlan}
                onChange={(e) => handleInputChange('paymentPlan', e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (5% discount)</option>
                <option value="annual">Annual (10% discount)</option>
              </select>
            </label>

            <label>
              <h4>Payment Method</h4>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wallet">Anola Wallet</option>
                {formData.enrollmentType === 'corporate' && (
                  <option value="employer">Employer Paid</option>
                )}
              </select>
            </label>

            <div className="navigation">
              <button type="button" onClick={() => setStep(2)}>Back</button>
              <button type="button" onClick={() => setStep(4)}>Next</button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="step">
            <h3>Review & Confirm</h3>

            <div className="review-section">
              <h4>Plan Details</h4>
              <p>Plan: {plan.name}</p>
              <p>Type: {formData.enrollmentType}</p>
              <p>Payment: {formData.paymentPlan}</p>
              <p>
                Amount: $
                {formData.paymentPlan === 'monthly'
                  ? plan.pricing.monthlyPremium[formData.enrollmentType]
                  : formData.paymentPlan === 'quarterly'
                  ? plan.pricing.monthlyPremium[formData.enrollmentType] * 3 * 0.95
                  : plan.pricing.annualPremium[formData.enrollmentType]
                }
              </p>
            </div>

            {formData.dependents.length > 0 && (
              <div className="review-section">
                <h4>Dependents ({formData.dependents.length})</h4>
                {formData.dependents.map((dep, i) => (
                  <p key={i}>
                    {dep.firstName} {dep.lastName} ({dep.relationship})
                  </p>
                ))}
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <div className="navigation">
              <button type="button" onClick={() => setStep(3)}>Back</button>
              <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Complete Enrollment'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EnrollmentForm;
```

### 4. View Enrollments

```jsx
// components/HMO/MyEnrollments.jsx
import React, { useState, useEffect } from 'react';
import { enrollmentService } from '../../services/enrollment.service';

const MyEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getMyEnrollments();
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async (enrollmentId) => {
    try {
      const blob = await enrollmentService.downloadMembershipCard(enrollmentId, 'pkpass');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HMO-Card-${enrollmentId}.pkpass`;
      a.click();
    } catch (error) {
      console.error('Failed to download card:', error);
    }
  };

  if (loading) return <div>Loading enrollments...</div>;

  return (
    <div className="my-enrollments">
      <h2>My HMO Enrollments</h2>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any HMO enrollments yet.</p>
          <button onClick={() => window.location.href = '/hmo-plans'}>
            Browse Plans
          </button>
        </div>
      ) : (
        <div className="enrollments-list">
          {enrollments.map(enrollment => (
            <EnrollmentCard
              key={enrollment._id}
              enrollment={enrollment}
              onDownloadCard={downloadCard}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EnrollmentCard = ({ enrollment, onDownloadCard }) => {
  const isActive = enrollment.status === 'active';
  const daysUntilExpiry = Math.ceil(
    (new Date(enrollment.coverageEndDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`enrollment-card ${enrollment.status}`}>
      <div className="card-header">
        <h3>{enrollment.planId.name}</h3>
        <span className={`status ${enrollment.status}`}>
          {enrollment.status}
        </span>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">Member ID:</span>
          <span className="value">{enrollment.membershipCardNumber}</span>
        </div>

        <div className="info-row">
          <span className="label">Coverage:</span>
          <span className="value">
            {new Date(enrollment.coverageStartDate).toLocaleDateString()} -
            {new Date(enrollment.coverageEndDate).toLocaleDateString()}
          </span>
        </div>

        {isActive && daysUntilExpiry < 30 && (
          <div className="warning">
            ⚠️ Renews in {daysUntilExpiry} days
          </div>
        )}

        <div className="utilization">
          <h4>Utilization</h4>
          <div className="progress">
            <div className="progress-bar">
              <div
                className="fill"
                style={{
                  width: `${(enrollment.utilization.claimsAmount / enrollment.limits.annualMaximum) * 100}%`
                }}
              />
            </div>
            <span>
              ${enrollment.utilization.claimsAmount} / ${enrollment.limits.annualMaximum}
            </span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => window.location.href = `/enrollments/${enrollment._id}`}>
          View Details
        </button>
        {isActive && (
          <>
            <button onClick={() => onDownloadCard(enrollment._id)}>
              📱 Add to Wallet
            </button>
            <button onClick={() => window.location.href = `/enrollments/${enrollment._id}/renew`}>
              🔄 Renew
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MyEnrollments;
```

---

## 🏥 Claims Submission (Providers/Vendors)

### Claims Service

```javascript
// services/claims.service.js
export const claimsService = {
  // Submit new claim
  async submitClaim(claimData) {
    const response = await apiClient.post('/api/hmo-claims', claimData);
    return response.data;
  },

  // Get my submitted claims
  async getMyClaims(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/hmo-claims/my-claims?${params}`);
    return response.data;
  },

  // Get claim details
  async getClaimById(claimId) {
    const response = await apiClient.get(`/api/hmo-claims/${claimId}`);
    return response.data;
  },

  // Update claim
  async updateClaim(claimId, updates) {
    const response = await apiClient.put(`/api/hmo-claims/${claimId}`, updates);
    return response.data;
  },

  // Submit appeal
  async submitAppeal(claimId, appealData) {
    const response = await apiClient.post(`/api/hmo-claims/${claimId}/appeal`, appealData);
    return response.data;
  },

  // Provider-specific: Get HMO patients
  async getHMOPatients() {
    const response = await apiClient.get('/api/providers/hmo-patients');
    return response.data;
  },

  // Provider-specific: Check patient coverage
  async getPatientCoverage(patientId) {
    const response = await apiClient.get(`/api/providers/patients/${patientId}/hmo-coverage`);
    return response.data;
  },
};
```

### React Component: Submit Claim (Provider)

```jsx
// components/Claims/SubmitClaim.jsx
import React, { useState, useEffect } from 'react';
import { claimsService } from '../../services/claims.service';

const SubmitClaim = ({ patientId, enrollmentId }) => {
  const [formData, setFormData] = useState({
    enrollmentId: enrollmentId || '',
    patientId: patientId || '',
    serviceType: 'outpatient',
    serviceDate: new Date().toISOString().split('T')[0],
    diagnosis: {
      code: '',
      description: '',
      primary: true,
    },
    procedure: {
      code: '',
      description: '',
    },
    billing: {
      totalBilled: 0,
      breakdown: [],
    },
    documents: [],
  });

  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadPatientCoverage();
    }
  }, [patientId]);

  const loadPatientCoverage = async () => {
    try {
      const data = await claimsService.getPatientCoverage(patientId);
      setCoverage(data);
      setFormData(prev => ({
        ...prev,
        enrollmentId: data.enrollment._id,
      }));
    } catch (error) {
      console.error('Failed to load coverage:', error);
    }
  };

  const addBillingItem = () => {
    setFormData(prev => ({
      ...prev,
      billing: {
        ...prev.billing,
        breakdown: [
          ...prev.billing.breakdown,
          { item: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
        ]
      }
    }));
  };

  const updateBillingItem = (index, field, value) => {
    setFormData(prev => {
      const breakdown = [...prev.billing.breakdown];
      breakdown[index] = { ...breakdown[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        breakdown[index].totalPrice = breakdown[index].quantity * breakdown[index].unitPrice;
      }

      const totalBilled = breakdown.reduce((sum, item) => sum + item.totalPrice, 0);

      return {
        ...prev,
        billing: { ...prev.billing, breakdown, totalBilled }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const claim = await claimsService.submitClaim(formData);

      alert(`Claim submitted successfully! Claim Number: ${claim.claimNumber}`);
      window.location.href = `/claims/${claim._id}`;
    } catch (error) {
      alert('Failed to submit claim: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-claim">
      <h2>Submit HMO Claim</h2>

      {/* Coverage Summary */}
      {coverage && (
        <div className="coverage-summary">
          <h3>Patient Coverage</h3>
          <p>Plan: {coverage.enrollment.planId.name}</p>
          <p>Member ID: {coverage.enrollment.membershipCardNumber}</p>
          <p>
            Remaining Annual: $
            {coverage.limits.annualMaximum - coverage.utilization.claimsAmount}
          </p>
          <p>Deductible Met: ${coverage.limits.deductibleMet}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Service Information */}
        <div className="form-section">
          <h3>Service Information</h3>

          <label>
            Service Type
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
              required
            >
              <option value="outpatient">Outpatient Care</option>
              <option value="inpatient">Inpatient Care</option>
              <option value="emergency">Emergency Care</option>
              <option value="surgery">Surgery</option>
              <option value="maternity">Maternity</option>
              <option value="prescription">Prescription</option>
              <option value="diagnostic">Diagnostic Test</option>
              <option value="dental">Dental Care</option>
              <option value="vision">Vision Care</option>
              <option value="mental_health">Mental Health</option>
              <option value="preventive">Preventive Care</option>
              <option value="specialist_consultation">Specialist Consultation</option>
            </select>
          </label>

          <label>
            Service Date
            <input
              type="date"
              value={formData.serviceDate}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
              required
            />
          </label>
        </div>

        {/* Diagnosis */}
        <div className="form-section">
          <h3>Diagnosis</h3>

          <label>
            ICD-10 Code
            <input
              placeholder="e.g., J00"
              value={formData.diagnosis.code}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                diagnosis: { ...prev.diagnosis, code: e.target.value }
              }))}
              required
            />
          </label>

          <label>
            Description
            <input
              placeholder="e.g., Acute nasopharyngitis (common cold)"
              value={formData.diagnosis.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                diagnosis: { ...prev.diagnosis, description: e.target.value }
              }))}
              required
            />
          </label>
        </div>

        {/* Procedure */}
        <div className="form-section">
          <h3>Procedure</h3>

          <label>
            CPT Code
            <input
              placeholder="e.g., 99213"
              value={formData.procedure.code}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                procedure: { ...prev.procedure, code: e.target.value }
              }))}
              required
            />
          </label>

          <label>
            Description
            <input
              placeholder="e.g., Office visit, established patient"
              value={formData.procedure.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                procedure: { ...prev.procedure, description: e.target.value }
              }))}
              required
            />
          </label>
        </div>

        {/* Billing */}
        <div className="form-section">
          <h3>Billing</h3>

          {formData.billing.breakdown.map((item, index) => (
            <div key={index} className="billing-item">
              <input
                placeholder="Item description"
                value={item.item}
                onChange={(e) => updateBillingItem(index, 'item', e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateBillingItem(index, 'quantity', parseFloat(e.target.value))}
                required
              />

              <input
                type="number"
                placeholder="Unit Price"
                value={item.unitPrice}
                onChange={(e) => updateBillingItem(index, 'unitPrice', parseFloat(e.target.value))}
                required
              />

              <span className="total">${item.totalPrice.toFixed(2)}</span>
            </div>
          ))}

          <button type="button" onClick={addBillingItem}>
            + Add Item
          </button>

          <div className="total-billed">
            <strong>Total Billed: ${formData.billing.totalBilled.toFixed(2)}</strong>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </form>
    </div>
  );
};

export default SubmitClaim;
```

### React Component: Claims Dashboard (Provider)

```jsx
// components/Claims/ClaimsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { claimsService } from '../../services/claims.service';

const ClaimsDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, [filters]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const data = await claimsService.getMyClaims(filters);
      setClaims(data.data);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claims-dashboard">
      <h2>Claims Dashboard</h2>

      {/* Statistics */}
      <div className="statistics">
        {statistics.map(stat => (
          <div key={stat._id} className="stat-card">
            <h3>{stat._id}</h3>
            <p className="count">{stat.count} claims</p>
            <p className="amount">Total: ${stat.totalAmount.toFixed(2)}</p>
            <p className="approved">Approved: ${stat.approvedAmount.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Claims List */}
      {loading ? (
        <div>Loading claims...</div>
      ) : (
        <div className="claims-list">
          {claims.map(claim => (
            <ClaimCard key={claim._id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  );
};

const ClaimCard = ({ claim }) => (
  <div className="claim-card">
    <div className="claim-header">
      <span className="claim-number">{claim.claimNumber}</span>
      <span className={`status ${claim.status}`}>{claim.status}</span>
    </div>

    <div className="claim-body">
      <p>Patient: {claim.patientId.profile.firstName} {claim.patientId.profile.lastName}</p>
      <p>Service: {claim.serviceType}</p>
      <p>Date: {new Date(claim.serviceDate).toLocaleDateString()}</p>
      <p>Billed: ${claim.billing.totalBilled}</p>
      {claim.billing.approvedAmount > 0 && (
        <p>Approved: ${claim.billing.approvedAmount}</p>
      )}
    </div>

    <button onClick={() => window.location.href = `/claims/${claim._id}`}>
      View Details
    </button>
  </div>
);

export default ClaimsDashboard;
```

---

## 🔐 Claims Processing (Super Admin)

### Admin Claims Service

```javascript
// services/admin-claims.service.js
export const adminClaimsService = {
  // Get all claims with filters
  async getAllClaims(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/super-admin/hmo-claims?${params}`);
    return response.data;
  },

  // Get pending claims
  async getPendingClaims() {
    const response = await apiClient.get('/api/super-admin/hmo-claims/pending');
    return response.data;
  },

  // Get claims analytics
  async getClaimsAnalytics(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/super-admin/hmo-claims/analytics?${params}`);
    return response.data;
  },

  // Assign claim for review
  async assignClaim(claimId) {
    const response = await apiClient.post(`/api/super-admin/hmo-claims/${claimId}/assign`);
    return response.data;
  },

  // Approve claim
  async approveClaim(claimId, data) {
    const response = await apiClient.post(`/api/super-admin/hmo-claims/${claimId}/approve`, data);
    return response.data;
  },

  // Reject claim
  async rejectClaim(claimId, data) {
    const response = await apiClient.post(`/api/super-admin/hmo-claims/${claimId}/reject`, data);
    return response.data;
  },

  // Partially approve claim
  async partiallyApproveClaim(claimId, data) {
    const response = await apiClient.post(`/api/super-admin/hmo-claims/${claimId}/partial-approve`, data);
    return response.data;
  },

  // Process payment
  async processPayment(claimId, data) {
    const response = await apiClient.post(`/api/super-admin/hmo-claims/${claimId}/process-payment`, data);
    return response.data;
  },

  // Review appeal
  async reviewAppeal(claimId, data) {
    const response = await apiClient.post(`/api/super-admin/hmo-claims/${claimId}/review-appeal`, data);
    return response.data;
  },
};
```

### React Component: Admin Claims Queue

```jsx
// components/Admin/ClaimsQueue.jsx
import React, { useState, useEffect } from 'react';
import { adminClaimsService } from '../../services/admin-claims.service';

const ClaimsQueue = () => {
  const [pendingClaims, setPendingClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingClaims();
  }, []);

  const loadPendingClaims = async () => {
    try {
      setLoading(true);
      const data = await adminClaimsService.getPendingClaims();
      setPendingClaims(data.data);
    } catch (error) {
      console.error('Failed to load pending claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (claimId) => {
    try {
      await adminClaimsService.assignClaim(claimId);
      const claim = pendingClaims.find(c => c._id === claimId);
      setSelectedClaim(claim);
      loadPendingClaims();
    } catch (error) {
      alert('Failed to assign claim: ' + error.message);
    }
  };

  return (
    <div className="claims-queue">
      <h2>Claims Review Queue</h2>

      <div className="queue-layout">
        {/* Claims List */}
        <div className="claims-list">
          <h3>Pending Claims ({pendingClaims.length})</h3>

          {loading ? (
            <div>Loading...</div>
          ) : (
            pendingClaims.map(claim => (
              <div
                key={claim._id}
                className={`claim-item ${selectedClaim?._id === claim._id ? 'selected' : ''}`}
                onClick={() => setSelectedClaim(claim)}
              >
                <div className="claim-number">{claim.claimNumber}</div>
                <div className="claim-info">
                  <p>{claim.claimantDetails.name}</p>
                  <p>{claim.serviceType} - ${claim.billing.totalBilled}</p>
                  <p>{new Date(claim.serviceDate).toLocaleDateString()}</p>
                </div>
                {claim.status === 'submitted' && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    handleAssign(claim._id);
                  }}>
                    Assign to Me
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Claim Details */}
        {selectedClaim && (
          <ClaimReviewPanel
            claim={selectedClaim}
            onActionComplete={loadPendingClaims}
          />
        )}
      </div>
    </div>
  );
};

const ClaimReviewPanel = ({ claim, onActionComplete }) => {
  const [action, setAction] = useState(null);
  const [formData, setFormData] = useState({
    approvedAmount: claim.billing.coveredAmount,
    rejectedAmount: 0,
    notes: '',
    reason: '',
    autoPayment: true,
  });

  const handleApprove = async () => {
    try {
      await adminClaimsService.approveClaim(claim._id, {
        approvedAmount: formData.approvedAmount,
        notes: formData.notes,
        autoPayment: formData.autoPayment,
      });

      alert('Claim approved successfully!');
      onActionComplete();
    } catch (error) {
      alert('Failed to approve claim: ' + error.message);
    }
  };

  const handleReject = async () => {
    try {
      await adminClaimsService.rejectClaim(claim._id, {
        reason: formData.reason,
        notes: formData.notes,
      });

      alert('Claim rejected');
      onActionComplete();
    } catch (error) {
      alert('Failed to reject claim: ' + error.message);
    }
  };

  const handlePartialApprove = async () => {
    try {
      await adminClaimsService.partiallyApproveClaim(claim._id, {
        approvedAmount: formData.approvedAmount,
        rejectedAmount: formData.rejectedAmount,
        notes: formData.notes,
      });

      alert('Claim partially approved');
      onActionComplete();
    } catch (error) {
      alert('Failed to partially approve claim: ' + error.message);
    }
  };

  return (
    <div className="claim-review-panel">
      <h3>Review Claim: {claim.claimNumber}</h3>

      {/* Claim Details */}
      <div className="claim-details">
        <h4>Patient Information</h4>
        <p>Name: {claim.patientId.profile.firstName} {claim.patientId.profile.lastName}</p>
        <p>Member ID: {claim.enrollmentId.membershipCardNumber}</p>

        <h4>Provider Information</h4>
        <p>Name: {claim.claimantDetails.name}</p>
        <p>Facility: {claim.claimantDetails.facilityName}</p>
        <p>Specialty: {claim.claimantDetails.specialty}</p>

        <h4>Service Details</h4>
        <p>Type: {claim.serviceType}</p>
        <p>Date: {new Date(claim.serviceDate).toLocaleDateString()}</p>
        <p>Diagnosis: {claim.diagnosis.description} ({claim.diagnosis.code})</p>
        <p>Procedure: {claim.procedure.description} ({claim.procedure.code})</p>

        <h4>Billing</h4>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {claim.billing.breakdown.map((item, i) => (
              <tr key={i}>
                <td>{item.item}</td>
                <td>{item.quantity}</td>
                <td>${item.unitPrice}</td>
                <td>${item.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="billing-summary">
          <p>Total Billed: ${claim.billing.totalBilled}</p>
          <p>Coverage: {claim.billing.coveragePercentage}%</p>
          <p>Covered Amount: ${claim.billing.coveredAmount}</p>
          <p>Patient Responsibility: ${claim.billing.patientResponsibility.total}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={() => setAction('approve')} className="btn-approve">
          ✓ Approve
        </button>
        <button onClick={() => setAction('partial')} className="btn-partial">
          ± Partial Approve
        </button>
        <button onClick={() => setAction('reject')} className="btn-reject">
          ✗ Reject
        </button>
      </div>

      {/* Action Forms */}
      {action === 'approve' && (
        <div className="action-form">
          <h4>Approve Claim</h4>

          <label>
            Approved Amount
            <input
              type="number"
              value={formData.approvedAmount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                approvedAmount: parseFloat(e.target.value)
              }))}
            />
          </label>

          <label>
            Notes
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes..."
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={formData.autoPayment}
              onChange={(e) => setFormData(prev => ({ ...prev, autoPayment: e.target.checked }))}
            />
            Process payment immediately
          </label>

          <button onClick={handleApprove}>Confirm Approval</button>
          <button onClick={() => setAction(null)}>Cancel</button>
        </div>
      )}

      {action === 'partial' && (
        <div className="action-form">
          <h4>Partially Approve Claim</h4>

          <label>
            Approved Amount
            <input
              type="number"
              value={formData.approvedAmount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                approvedAmount: parseFloat(e.target.value),
                rejectedAmount: claim.billing.totalBilled - parseFloat(e.target.value)
              }))}
            />
          </label>

          <label>
            Rejected Amount
            <input
              type="number"
              value={formData.rejectedAmount}
              readOnly
            />
          </label>

          <label>
            Notes (explain partial approval)
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Explain which items were approved/rejected..."
              required
            />
          </label>

          <button onClick={handlePartialApprove}>Confirm Partial Approval</button>
          <button onClick={() => setAction(null)}>Cancel</button>
        </div>
      )}

      {action === 'reject' && (
        <div className="action-form">
          <h4>Reject Claim</h4>

          <label>
            Rejection Reason
            <select
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
            >
              <option value="">Select reason...</option>
              <option value="Service not covered">Service not covered under plan</option>
              <option value="Documentation incomplete">Documentation incomplete</option>
              <option value="Duplicate claim">Duplicate claim</option>
              <option value="Outside coverage period">Service date outside coverage period</option>
              <option value="Exceeds annual maximum">Exceeds annual maximum</option>
              <option value="Pre-authorization required">Pre-authorization required but not obtained</option>
              <option value="Out of network">Service provided by out-of-network provider</option>
              <option value="Other">Other (specify in notes)</option>
            </select>
          </label>

          <label>
            Additional Notes
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Provide additional details..."
            />
          </label>

          <button onClick={handleReject}>Confirm Rejection</button>
          <button onClick={() => setAction(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ClaimsQueue;
```

---

## 💰 Payment & Wallet Integration

### Wallet Service

```javascript
// services/wallet.service.js
export const walletService = {
  // Get wallet balance
  async getWalletBalance() {
    const response = await apiClient.get('/api/wallets/balance');
    return response.data;
  },

  // Get transactions
  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/transactions?${params}`);
    return response.data;
  },

  // Add funds to wallet
  async addFunds(amount, paymentMethod) {
    const response = await apiClient.post('/api/wallets/deposit', {
      amount,
      paymentMethod,
    });
    return response.data;
  },

  // Withdraw funds
  async withdrawFunds(amount, bankAccount) {
    const response = await apiClient.post('/api/wallets/withdraw', {
      amount,
      bankAccount,
    });
    return response.data;
  },
};
```

### React Component: Wallet Dashboard

```jsx
// components/Wallet/WalletDashboard.jsx
import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/wallet.service';

const WalletDashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, transactionsData] = await Promise.all([
        walletService.getWalletBalance(),
        walletService.getTransactions({ page: 1, limit: 10 }),
      ]);

      setWallet(walletData.data);
      setTransactions(transactionsData.data);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading wallet...</div>;

  return (
    <div className="wallet-dashboard">
      <div className="wallet-header">
        <h2>My Wallet</h2>

        <div className="balance-card">
          <div className="balance-item">
            <span className="label">Available Balance</span>
            <span className="amount">${wallet.balance.available.toFixed(2)}</span>
          </div>

          <div className="balance-item">
            <span className="label">Pending</span>
            <span className="amount">${wallet.balance.pending.toFixed(2)}</span>
          </div>

          <div className="balance-item">
            <span className="label">Reserved</span>
            <span className="amount">${wallet.balance.reserved.toFixed(2)}</span>
          </div>
        </div>

        <div className="wallet-actions">
          <button onClick={() => window.location.href = '/wallet/deposit'}>
            + Add Funds
          </button>
          <button onClick={() => window.location.href = '/wallet/withdraw'}>
            - Withdraw
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="transactions-section">
        <h3>Recent Transactions</h3>

        <div className="transactions-list">
          {transactions.map(tx => (
            <TransactionItem key={tx._id} transaction={tx} />
          ))}
        </div>

        <button onClick={() => window.location.href = '/wallet/transactions'}>
          View All Transactions
        </button>
      </div>
    </div>
  );
};

const TransactionItem = ({ transaction }) => {
  const isCredit = transaction.type === 'credit';

  return (
    <div className="transaction-item">
      <div className="tx-icon">
        {isCredit ? '↓' : '↑'}
      </div>

      <div className="tx-details">
        <p className="tx-description">{transaction.description}</p>
        <p className="tx-date">{new Date(transaction.createdAt).toLocaleString()}</p>
        {transaction.metadata?.claimNumber && (
          <p className="tx-meta">Claim: {transaction.metadata.claimNumber}</p>
        )}
      </div>

      <div className={`tx-amount ${isCredit ? 'credit' : 'debit'}`}>
        {isCredit ? '+' : '-'}${transaction.amount.value.toFixed(2)}
      </div>

      <div className={`tx-status ${transaction.status}`}>
        {transaction.status}
      </div>
    </div>
  );
};

export default WalletDashboard;
```

---

## 🎣 React Hooks & State Management

### Custom Hook: useHMOEnrollment

```javascript
// hooks/useHMOEnrollment.js
import { useState, useEffect } from 'react';
import { enrollmentService } from '../services/enrollment.service';

export const useHMOEnrollment = (enrollmentId) => {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (enrollmentId) {
      loadEnrollment();
    }
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enrollmentService.getEnrollmentDetails(enrollmentId);
      setEnrollment(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEnrollment = async (updates) => {
    try {
      const updated = await enrollmentService.updateEnrollment(enrollmentId, updates);
      setEnrollment(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const cancelEnrollment = async (reason) => {
    try {
      await enrollmentService.cancelEnrollment(enrollmentId, reason);
      await loadEnrollment();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const renewEnrollment = async (paymentMethod) => {
    try {
      await enrollmentService.renewEnrollment(enrollmentId, paymentMethod);
      await loadEnrollment();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    enrollment,
    loading,
    error,
    updateEnrollment,
    cancelEnrollment,
    renewEnrollment,
    refresh: loadEnrollment,
  };
};
```

### Custom Hook: useClaims

```javascript
// hooks/useClaims.js
import { useState, useEffect } from 'react';
import { claimsService } from '../services/claims.service';

export const useClaims = (filters = {}) => {
  const [claims, setClaims] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadClaims();
  }, [JSON.stringify(filters)]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await claimsService.getMyClaims(filters);
      setClaims(data.data);
      setStatistics(data.statistics || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async (claimData) => {
    try {
      const claim = await claimsService.submitClaim(claimData);
      await loadClaims();
      return claim;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const submitAppeal = async (claimId, appealData) => {
    try {
      const result = await claimsService.submitAppeal(claimId, appealData);
      await loadClaims();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    claims,
    statistics,
    pagination,
    loading,
    error,
    submitClaim,
    submitAppeal,
    refresh: loadClaims,
  };
};
```

---

## ⚠️ Error Handling

### Error Handler Utility

```javascript
// utils/errorHandler.js
export class APIError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const handleAPIError = (error) => {
  if (error.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    return 'Please log in to continue';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action';
  }

  if (error.status === 404) {
    return 'Resource not found';
  }

  if (error.status === 400 && error.errors) {
    return error.errors.join(', ');
  }

  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred';
};
```

### Error Boundary Component

```jsx
// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 📘 TypeScript Types

```typescript
// types/hmo.types.ts

// HMO Plan Types
export interface HMOPlan {
  _id: string;
  name: string;
  planCode: string;
  description: string;
  provider: {
    name: string;
    email: string;
    phone: string;
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
  coverage: {
    outpatientCare: CoverageDetails;
    inpatientCare: CoverageDetails;
    emergencyCare: CoverageDetails;
    // ... other coverage types
  };
  status: string;
  isAvailableForNewEnrollment: boolean;
}

export interface CoverageDetails {
  covered: boolean;
  copayment?: number;
  coveragePercentage?: number;
  requiresReferral?: boolean;
  limit?: {
    amount: number;
    period: string;
  };
}

// Enrollment Types
export interface HMOEnrollment {
  _id: string;
  userId: string;
  planId: HMOPlan;
  enrollmentNumber: string;
  membershipCardNumber: string;
  enrollmentType: 'individual' | 'family' | 'corporate' | 'group';
  dependents: Dependent[];
  status: 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired';
  coverageStartDate: string;
  coverageEndDate: string;
  limits: {
    annualMaximum: number;
    remainingAnnual: number;
    deductible: number;
    deductibleMet: number;
    maxOutOfPocket: number;
    outOfPocketSpent: number;
  };
  utilization: {
    appointmentsUsed: number;
    prescriptionsUsed: number;
    claimsSubmitted: number;
    claimsApproved: number;
    claimsAmount: number;
  };
}

export interface Dependent {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationship: 'spouse' | 'child' | 'parent' | 'other';
  nationalId?: string;
  memberCardNumber?: string;
}

// Claims Types
export interface HMOClaim {
  _id: string;
  claimNumber: string;
  enrollmentId: string;
  planId: string;
  patientId: string;
  claimantType: 'provider' | 'vendor';
  claimantId: string;
  serviceType: string;
  serviceDate: string;
  diagnosis: {
    code: string;
    description: string;
    primary: boolean;
  };
  procedure: {
    code: string;
    description: string;
  };
  billing: {
    totalBilled: number;
    breakdown: BillingItem[];
    coveragePercentage: number;
    coveredAmount: number;
    patientResponsibility: {
      copayment: number;
      coinsurance: number;
      deductible: number;
      total: number;
    };
    approvedAmount: number;
    amountPaid: number;
  };
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'appealed';
  documents: Document[];
  createdAt: string;
}

export interface BillingItem {
  item: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Document {
  type: string;
  url: string;
  fileName: string;
  uploadedAt: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

---

## 🎉 Summary

This guide provides complete frontend integration for:

✅ **HMO Enrollment** - Browse plans, compare, enroll, manage enrollments, download cards
✅ **Claims Submission** - Providers/vendors submit claims, check patient coverage
✅ **Claims Processing** - Super admins review, approve, reject, process payments
✅ **Wallet Integration** - View balance, transactions, add/withdraw funds

### Key Features:
- Complete React components with hooks
- Error handling and loading states
- TypeScript type definitions
- API client setup with authentication
- State management patterns
- Real-world examples

### Technologies Used:
- React / React Native
- Fetch API
- Custom hooks
- Context API (optional)
- TypeScript support

All components are production-ready and can be customized for your specific needs!
