# API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found",
    "details": {}
  }
}
```

---

## Orders

### List Orders

```http
GET /api/orders
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| status | string | - | Filter by status |
| riskLevel | string | - | Filter by risk level (HIGH, MEDIUM, LOW) |
| salespersonId | string | - | Filter by salesperson |
| search | string | - | Search customer name, phone, vehicle |
| includeCompleted | boolean | false | Include delivered/cancelled |

**Example Request:**

```bash
curl "http://localhost:3000/api/orders?riskLevel=HIGH&pageSize=10"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx1234...",
      "status": "BOOKING_DONE",
      "source": "WALK_IN",
      "totalAmount": 285000,
      "riskScore": 72,
      "riskLevel": "HIGH",
      "customer": {
        "id": "clx5678...",
        "name": "Mohammed Al Rashid",
        "phone": "+971-50-123-4567"
      },
      "vehicle": {
        "id": "clx9012...",
        "make": "Toyota",
        "model": "Land Cruiser",
        "year": 2024
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### Get Order

```http
GET /api/orders/:id
```

**Example Request:**

```bash
curl "http://localhost:3000/api/orders/clx1234..."
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx1234...",
    "status": "BOOKING_DONE",
    "source": "WALK_IN",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-04T15:30:00.000Z",
    "expectedDeliveryDate": "2024-01-15T00:00:00.000Z",
    "totalAmount": 285000,
    "bookingAmount": 10000,
    "financingStatus": "PENDING",
    "riskScore": 72,
    "riskLevel": "HIGH",
    "fulfillmentProbability": 28,
    "lastContactDaysAgo": 12,
    "customer": {
      "id": "clx5678...",
      "name": "Mohammed Al Rashid",
      "email": "mohammed@email.com",
      "phone": "+971-50-123-4567",
      "preferredChannel": "WHATSAPP"
    },
    "vehicle": {
      "id": "clx9012...",
      "make": "Toyota",
      "model": "Land Cruiser",
      "variant": "GXR V8",
      "year": 2024,
      "color": "Pearl White",
      "vin": "JTMHY7AJ5L4000001"
    },
    "salesperson": {
      "id": "clxabc...",
      "name": "Ahmed Hassan",
      "email": "ahmed@autolead.ai"
    },
    "activities": [...],
    "latestPriority": {
      "riskScore": 72,
      "riskLevel": "HIGH",
      "riskFactors": [...],
      "nextBestAction": {...}
    }
  }
}
```

---

### Update Order

```http
PATCH /api/orders/:id
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| status | string | New order status |
| financingStatus | string | Financing status |
| expectedDeliveryDate | string | ISO date string |
| salespersonId | string | Assign salesperson |

**Example Request:**

```bash
curl -X PATCH "http://localhost:3000/api/orders/clx1234..." \
  -H "Content-Type: application/json" \
  -d '{"status": "FINANCING_APPROVED"}'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx1234...",
    "status": "FINANCING_APPROVED",
    ...
  }
}
```

---

## Priority List

### Get Priority List

```http
GET /api/priority-list
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| salespersonId | string | - | Filter by salesperson |
| riskLevel | string | - | Filter by risk level |
| limit | number | 20 | Max items (max 50) |

**Example Request:**

```bash
curl "http://localhost:3000/api/priority-list?limit=10"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-01-04",
    "generatedAt": "2024-01-04T15:30:00.000Z",
    "summary": {
      "highRisk": 2,
      "mediumRisk": 3,
      "lowRisk": 2,
      "totalActions": 5
    },
    "stats": {
      "averageRiskScore": 45,
      "averageFulfillmentProbability": 62,
      "totalOrderValue": 2500000,
      "atRiskOrderValue": 1200000
    },
    "items": [
      {
        "id": "priority-clx1234-2024-01-04",
        "orderId": "clx1234...",
        "rank": 1,
        "riskScore": 72,
        "riskLevel": "HIGH",
        "riskFactors": [
          {
            "factor": "Customer Silence",
            "impact": 25,
            "description": "No contact for 12 days"
          },
          {
            "factor": "Financing Pending",
            "impact": 30,
            "description": "Awaiting approval for 5 days"
          }
        ],
        "nextBestAction": {
          "action": "Call customer to follow up on financing status",
          "channel": "CALL",
          "urgency": "NOW",
          "expectedImpact": "Reduce cancellation risk by 23%",
          "reasoning": "Financing approval probability drops significantly after day 5"
        },
        "order": {...}
      }
    ]
  }
}
```

---

## Activities

### List Activities

```http
GET /api/activities
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| orderId | string | - | Filter by order |
| type | string | - | Filter by activity type |
| channel | string | - | Filter by channel |

**Example Request:**

```bash
curl "http://localhost:3000/api/activities?orderId=clx1234..."
```

---

### Create Activity

```http
POST /api/activities
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | Yes | Order ID |
| type | string | Yes | Activity type |
| channel | string | Yes | Communication channel |
| summary | string | Yes | Activity summary |
| details | string | No | Additional details |
| sentiment | string | No | POSITIVE, NEUTRAL, NEGATIVE |
| performedById | string | No | User who performed |
| duration | number | No | Duration in seconds |

**Activity Types:**

- `CALL_OUTBOUND`
- `CALL_INBOUND`
- `WHATSAPP_SENT`
- `WHATSAPP_RECEIVED`
- `EMAIL_SENT`
- `EMAIL_RECEIVED`
- `VISIT`
- `TEST_DRIVE`
- `STATUS_CHANGE`
- `NOTE`

**Channels:**

- `CALL`
- `WHATSAPP`
- `EMAIL`
- `IN_PERSON`
- `SYSTEM`

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "clx1234...",
    "type": "CALL_OUTBOUND",
    "channel": "CALL",
    "summary": "Discussed financing options with customer",
    "sentiment": "POSITIVE",
    "duration": 300
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxact...",
    "orderId": "clx1234...",
    "type": "CALL_OUTBOUND",
    "channel": "CALL",
    "summary": "Discussed financing options with customer",
    "sentiment": "POSITIVE",
    "performedAt": "2024-01-04T15:30:00.000Z",
    "duration": 300
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid request parameters |
| NOT_FOUND | 404 | Resource not found |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

Currently no rate limits are enforced. Future versions will implement:

- 100 requests per minute per IP
- 1000 requests per hour per authenticated user
