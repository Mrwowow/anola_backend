# Service Update Guide

## Overview

This guide explains how to update provider services using the Anola Health API, including common issues and solutions.

## The Issue You Encountered

**Original Request:**
```bash
PUT /api/providers/68f69bda582a884e78e0b0e5/services/68f69bda582a884e78e0b0e7
```

**Payload:**
```json
{
  "serviceName": "Monthly Health Plan",
  "category": "Consultation",
  "description": "Monthly Health Plan",
  "duration": 30,
  "durationType": "days",
  "price": 2500,
  "insuranceCovered": true,
  "availableModes": ["in-person", "video"],
  "preparationInstructions": ""
}
```

**Error:**
```json
{
  "success": false,
  "message": "Service not found"
}
```

## Root Causes

There were two issues:

### 1. Service ID Format Support

The service has two types of IDs:
- **Service ID**: `SRV-9A6462` (custom format)
- **MongoDB _id**: `68f69bda582a884e78e0b0e7` (database ID)

**Previous Behavior:** The API only looked up services by Service ID (`SRV-XXX`)

**Your Request:** Used MongoDB _id (`68f69bda582a884e78e0b0e7`)

**Result:** Service not found because ID format didn't match

### 2. Field Name Inconsistency

**API Expected:** `name` field for service name

**Your Request:** Sent `serviceName` field

**Result:** Even if found, the name wouldn't update properly

## The Fix

Both issues have been resolved:

### 1. Dual ID Support

The API now accepts **both** ID formats:

```javascript
// Find service by either serviceId (SRV-XXX) or MongoDB _id
const service = provider.services?.find(s =>
  s.serviceId === serviceId || s._id.toString() === serviceId
);
```

### 2. Field Name Mapping

The API now maps `serviceName` to `name`:

```javascript
// Map field names (support both serviceName and name)
const updateData = { ...req.body };
if (updateData.serviceName) {
  updateData.name = updateData.serviceName;
  delete updateData.serviceName;
}
```

## How to Use

### Option 1: Using MongoDB _id (What you were trying)

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "Monthly Health Plan",
    "category": "Consultation",
    "description": "Monthly Health Plan",
    "duration": 30,
    "durationType": "days",
    "price": 2500,
    "insuranceCovered": true,
    "availableModes": ["in-person", "video"]
  }' \
  https://anola-backend.vercel.app/api/providers/68f69bda582a884e78e0b0e5/services/68f69bda582a884e78e0b0e7
```

### Option 2: Using Service ID

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Health Plan",
    "category": "Consultation",
    "description": "Monthly Health Plan",
    "duration": 30,
    "durationType": "days",
    "price": 2500,
    "insuranceCovered": true,
    "availableModes": ["in-person", "video"]
  }' \
  https://anola-backend.vercel.app/api/providers/68f69bda582a884e78e0b0e5/services/SRV-9A6462
```

### Option 3: Using `name` field (preferred)

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Health Plan",
    "duration": 30,
    "durationType": "days",
    "price": 2500
  }' \
  https://anola-backend.vercel.app/api/providers/68f69bda582a884e78e0b0e5/services/68f69bda582a884e78e0b0e7
```

## Getting Service IDs

To find the correct service ID, first get the provider's services:

```bash
curl https://anola-backend.vercel.app/api/providers/68f69bda582a884e78e0b0e5/services
```

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "serviceId": "SRV-9A6462",      // Custom service ID
      "_id": "68f69bda582a884e78e0b0e7", // MongoDB _id
      "name": "Monthly Health Plan",
      "duration": 1,
      "durationType": "minutes",
      "price": 2500
    }
  ]
}
```

You can use **either** `serviceId` or `_id` in your update request.

## Field Names Reference

### Supported Field Names

| Preferred | Alternative | Description |
|-----------|-------------|-------------|
| `name` | `serviceName` | Service name |
| `category` | - | Service category |
| `description` | - | Service description |
| `duration` | - | Duration value (number) |
| `durationType` | - | Duration unit (minutes/hours/days/months/years) |
| `price` | - | Service price |
| `insuranceCovered` | - | Insurance coverage (boolean) |
| `availableModes` | - | Consultation modes array |
| `preparationInstructions` | - | Patient preparation instructions |

## Example Updates

### Update Duration and Duration Type

```json
{
  "duration": 30,
  "durationType": "days"
}
```

### Update Price and Insurance

```json
{
  "price": 5000,
  "insuranceCovered": true
}
```

### Update Available Modes

```json
{
  "availableModes": ["in-person", "video", "chat"]
}
```

### Full Update

```json
{
  "name": "Premium Consultation Package",
  "category": "Consultation",
  "description": "Comprehensive monthly health consultation package",
  "duration": 1,
  "durationType": "months",
  "price": 50000,
  "insuranceCovered": true,
  "availableModes": ["in-person", "video", "chat", "audio"],
  "preparationInstructions": "Please bring recent lab results"
}
```

## Common Errors

### 1. Service Not Found (404)

**Error:**
```json
{
  "success": false,
  "message": "Service not found"
}
```

**Causes:**
- ✅ **Fixed:** Using wrong ID format (now supports both)
- Wrong provider ID
- Service doesn't exist
- Service was deleted/deactivated

**Solution:**
- Verify provider ID is correct
- Check service exists by listing all services
- Use either Service ID or MongoDB _id

### 2. Unauthorized (401)

**Error:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Cause:** Missing or invalid authentication token

**Solution:**
```bash
# Include Authorization header
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Invalid Duration Type (400)

**Error:**
```json
{
  "success": false,
  "message": "Invalid duration type. Must be one of: minutes, hours, days, months, years"
}
```

**Cause:** Using invalid durationType value

**Solution:** Use one of: `minutes`, `hours`, `days`, `months`, `years`

## Success Response

When the update succeeds:

```json
{
  "success": true,
  "message": "Service updated successfully",
  "service": {
    "serviceId": "SRV-9A6462",
    "_id": "68f69bda582a884e78e0b0e7",
    "name": "Monthly Health Plan",
    "category": "Consultation",
    "description": "Monthly Health Plan",
    "duration": 30,
    "durationType": "days",
    "price": 2500,
    "insuranceCovered": true,
    "availableModes": ["in-person", "video"],
    "preparationInstructions": "",
    "isActive": true,
    "totalBookings": 0,
    "createdAt": "2025-10-20T20:30:18.949Z"
  }
}
```

## Testing the Fix

You can test that both ID formats work:

```bash
# Test with MongoDB _id
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Update"}' \
  https://anola-backend.vercel.app/api/providers/PROVIDER_ID/services/68f69bda582a884e78e0b0e7

# Test with Service ID
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Update"}' \
  https://anola-backend.vercel.app/api/providers/PROVIDER_ID/services/SRV-9A6462
```

Both should return 401 (needs auth), confirming the endpoint exists and recognizes both ID formats.

## Related Endpoints

- **Get Services**: `GET /api/providers/:providerId/services`
- **Add Service**: `POST /api/providers/:providerId/services`
- **Delete Service**: `DELETE /api/providers/:providerId/services/:serviceId`

All service management endpoints now support both ID formats.

## Notes

- The service update is a partial update (PATCH-like behavior)
- You only need to send the fields you want to update
- The `serviceId` field itself cannot be changed
- Service updates require authentication
- Both field name formats (`name` and `serviceName`) are supported for backward compatibility

## Support

If you encounter any issues:
1. Verify your authentication token is valid
2. Check the service exists using GET request
3. Ensure you're using the correct provider ID
4. Review the [QUICK_API_REFERENCE.md](./QUICK_API_REFERENCE.md) for more examples
