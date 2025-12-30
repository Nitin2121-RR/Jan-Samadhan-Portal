---
inclusion: manual
---

# Testing Strategy for Jan-Samadhan

## Testing Philosophy

### Test Pyramid Approach
- **Unit Tests (70%)**: Fast, isolated tests for individual functions and components
- **Integration Tests (20%)**: Test component interactions and API endpoints
- **End-to-End Tests (10%)**: Full user journey testing

### Property-Based Testing
- Use fast-check for TypeScript property-based testing
- Focus on business logic and data transformations
- Test invariants and universal properties
- Minimum 100 iterations per property test

## Frontend Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GrievanceCard } from './GrievanceCard';

describe('GrievanceCard', () => {
  it('should display grievance information correctly', () => {
    const mockGrievance = {
      id: '1',
      title: 'Pothole on Main Street',
      status: 'OPEN',
      priority: 'HIGH'
    };
    
    render(<GrievanceCard grievance={mockGrievance} />);
    
    expect(screen.getByText('Pothole on Main Street')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useGrievanceForm } from './useGrievanceForm';

describe('useGrievanceForm', () => {
  it('should validate form data correctly', () => {
    const { result } = renderHook(() => useGrievanceForm());
    
    act(() => {
      result.current.setTitle('');
    });
    
    expect(result.current.errors.title).toBe('Title is required');
  });
});
```

### Property-Based Component Testing
```typescript
import fc from 'fast-check';

describe('GrievanceCard Properties', () => {
  it('should handle any valid grievance data', () => {
    fc.assert(fc.property(
      fc.record({
        id: fc.string(),
        title: fc.string(1, 200),
        status: fc.constantFrom('OPEN', 'IN_PROGRESS', 'RESOLVED'),
        priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH')
      }),
      (grievance) => {
        const { container } = render(<GrievanceCard grievance={grievance} />);
        expect(container.firstChild).not.toBeNull();
      }
    ));
  });
});
```

## Backend Testing

### API Endpoint Testing
```typescript
import request from 'supertest';
import { app } from '../app';

describe('POST /api/grievances', () => {
  it('should create a new grievance', async () => {
    const grievanceData = {
      title: 'Test Grievance',
      description: 'Test Description',
      category: 'pothole',
      location: { latitude: 12.9716, longitude: 77.5946 }
    };
    
    const response = await request(app)
      .post('/api/grievances')
      .send(grievanceData)
      .expect(201);
    
    expect(response.body.title).toBe('Test Grievance');
    expect(response.body.ticket_id).toBeDefined();
  });
});
```

### Service Layer Testing
```typescript
import { GrievanceService } from './grievance.service';
import { prismaMock } from '../__mocks__/prisma';

describe('GrievanceService', () => {
  it('should create grievance with proper validation', async () => {
    const mockGrievance = {
      id: '1',
      title: 'Test',
      description: 'Test Description'
    };
    
    prismaMock.grievance.create.mockResolvedValue(mockGrievance);
    
    const result = await GrievanceService.create(mockGrievance);
    
    expect(result).toEqual(mockGrievance);
    expect(prismaMock.grievance.create).toHaveBeenCalledWith({
      data: mockGrievance
    });
  });
});
```

### Property-Based API Testing
```typescript
import fc from 'fast-check';

describe('Grievance API Properties', () => {
  it('should handle any valid grievance creation data', () => {
    fc.assert(fc.property(
      fc.record({
        title: fc.string(10, 200),
        description: fc.string(20, 2000),
        category: fc.constantFrom('pothole', 'garbage', 'streetlight'),
        location: fc.record({
          latitude: fc.float(-90, 90),
          longitude: fc.float(-180, 180)
        })
      }),
      async (grievanceData) => {
        const response = await request(app)
          .post('/api/grievances')
          .send(grievanceData);
        
        expect([200, 201]).toContain(response.status);
        if (response.status === 201) {
          expect(response.body.ticket_id).toBeDefined();
        }
      }
    ));
  });
});
```

## Blockchain Testing

### Smart Contract Testing
```typescript
import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('GrievanceRegistry', () => {
  it('should register a grievance correctly', async () => {
    const [owner, user] = await ethers.getSigners();
    const GrievanceRegistry = await ethers.getContractFactory('GrievanceRegistry');
    const registry = await GrievanceRegistry.deploy();
    
    const tx = await registry.connect(user).registerGrievance(
      'ticket-123',
      'QmHash123',
      1 // severity
    );
    
    await expect(tx)
      .to.emit(registry, 'GrievanceRegistered')
      .withArgs('ticket-123', user.address, 'QmHash123', 1);
  });
});
```

### Blockchain Integration Testing
```typescript
describe('Blockchain Service', () => {
  it('should handle contract interaction failures gracefully', async () => {
    const mockProvider = {
      getNetwork: jest.fn().mockRejectedValue(new Error('Network error'))
    };
    
    const blockchainService = new BlockchainService(mockProvider);
    
    const result = await blockchainService.registerGrievance('ticket-123');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
```

## AI Testing

### AI Service Testing
```typescript
describe('AI Analysis Service', () => {
  it('should classify civic issues correctly', async () => {
    const mockImage = 'base64-encoded-image';
    const mockResponse = {
      is_civic: true,
      category: 'pothole',
      severity: 7,
      confidence: 0.85
    };
    
    jest.spyOn(aiService, 'analyzeImage').mockResolvedValue(mockResponse);
    
    const result = await aiService.analyzeImage(mockImage);
    
    expect(result.is_civic).toBe(true);
    expect(result.category).toBe('pothole');
    expect(result.severity).toBeGreaterThan(0);
  });
});
```

### Property-Based AI Testing
```typescript
describe('AI Classification Properties', () => {
  it('should always return valid severity scores', () => {
    fc.assert(fc.property(
      fc.base64String(),
      async (imageData) => {
        const result = await aiService.analyzeImage(imageData);
        
        if (result.is_civic) {
          expect(result.severity).toBeGreaterThanOrEqual(1);
          expect(result.severity).toBeLessThanOrEqual(10);
          expect(Number.isInteger(result.severity)).toBe(true);
        }
      }
    ));
  });
});
```

## Performance Testing

### Load Testing
```typescript
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let response = http.get('https://api.jan-samadhan.com/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Test Configuration

### Jest Configuration
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Data Management
```typescript
// Test data factories
export const createMockGrievance = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  status: 'OPEN',
  priority: 'MEDIUM',
  created_at: new Date(),
  ...overrides
});
```