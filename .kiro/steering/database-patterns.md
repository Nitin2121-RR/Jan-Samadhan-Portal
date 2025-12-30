---
inclusion: fileMatch
fileMatchPattern: "**/*prisma*"
---

# Database Patterns and Best Practices

## Prisma ORM Guidelines

### Schema Design Principles
- Use descriptive model and field names
- Implement proper relationships with foreign keys
- Use appropriate field types and constraints
- Include created_at and updated_at timestamps

### Migration Best Practices
```prisma
// Always use descriptive migration names
// npx prisma migrate dev --name add_department_field

model Grievance {
  id          String   @id @default(cuid())
  ticket_id   String   @unique
  title       String
  description String
  status      Status   @default(OPEN)
  priority    Priority @default(MEDIUM)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relationships
  user        User     @relation(fields: [user_id], references: [id])
  user_id     String
  department  Department @relation(fields: [department_id], references: [id])
  department_id String
  
  @@map("grievances")
}
```

### Query Optimization
- Use `select` to fetch only required fields
- Implement proper pagination with cursor-based pagination
- Use `include` and `select` strategically
- Leverage database indexes for frequently queried fields

### Transaction Patterns
```typescript
// Use transactions for multi-table operations
const result = await prisma.$transaction(async (tx) => {
  const grievance = await tx.grievance.create({
    data: grievanceData
  });
  
  await tx.notification.create({
    data: {
      user_id: grievance.user_id,
      message: `Grievance ${grievance.ticket_id} created`
    }
  });
  
  return grievance;
});
```

## Performance Optimization

### Indexing Strategy
```prisma
model Grievance {
  // ... fields
  
  @@index([status, created_at])
  @@index([department_id, priority])
  @@index([user_id, status])
}
```

### Connection Pooling
```typescript
// Configure connection pool size based on deployment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Query Batching
```typescript
// Use batch operations for bulk updates
const updateMany = await prisma.grievance.updateMany({
  where: { status: 'OPEN', created_at: { lt: thirtyDaysAgo } },
  data: { status: 'ESCALATED' }
});
```

## Data Validation and Security

### Input Validation
```typescript
import { z } from 'zod';

const CreateGrievanceSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(2000),
  category: z.enum(['pothole', 'garbage', 'streetlight']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  })
});
```

### Soft Deletes
```prisma
model Grievance {
  // ... other fields
  deleted_at DateTime?
  
  @@map("grievances")
}
```

### Audit Logging
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  table_name String
  record_id  String
  action     String   // CREATE, UPDATE, DELETE
  old_values Json?
  new_values Json?
  user_id    String?
  created_at DateTime @default(now())
  
  @@map("audit_logs")
}
```

## Backup and Recovery

### Automated Backups
- Schedule regular database backups
- Test backup restoration procedures
- Implement point-in-time recovery
- Store backups in secure, separate locations

### Data Retention Policies
- Implement data archiving for old records
- Define retention periods for different data types
- Comply with data protection regulations
- Provide data export capabilities for users

## Monitoring and Alerting

### Query Performance Monitoring
- Monitor slow queries and optimize them
- Track database connection usage
- Set up alerts for high CPU/memory usage
- Monitor disk space and growth trends

### Health Checks
```typescript
// Database health check endpoint
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 500 });
  }
}
```