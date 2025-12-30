---
inclusion: always
---

# Jan-Samadhan Project Standards

## Code Quality Standards

### TypeScript Configuration
- Strict mode enabled for all TypeScript files
- Use explicit return types for all functions
- Prefer interfaces over types for object definitions
- Use proper generic constraints and utility types

### React Component Standards
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization where appropriate
- Follow the component composition pattern

### API Design Standards
- RESTful endpoints with proper HTTP status codes
- Consistent error response format:
  ```json
  {
    "error": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  }
  ```
- Use Zod for request/response validation
- Implement proper rate limiting and authentication

### Database Standards
- Use Prisma ORM for all database operations
- Implement proper database migrations
- Use transactions for multi-table operations
- Follow proper indexing strategies for performance

### Security Standards
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Sanitize file uploads and validate file types
- Use HTTPS for all API communications

### Testing Standards
- Minimum 80% code coverage for critical paths
- Use property-based testing for business logic
- Mock external dependencies in unit tests
- Write integration tests for API endpoints
- Test error scenarios and edge cases

## Architecture Patterns

### Frontend Architecture
- Feature-based folder structure
- Separation of concerns: components, services, hooks
- Use React Query for server state management
- Implement proper loading and error states

### Backend Architecture
- Layered architecture: controllers, services, repositories
- Use dependency injection where appropriate
- Implement proper logging and monitoring
- Use environment-specific configurations

### Blockchain Integration
- Use ethers.js for smart contract interactions
- Implement proper error handling for blockchain operations
- Use event listeners for real-time updates
- Maintain fallback mechanisms for blockchain failures

## Performance Standards

### Frontend Performance
- Lazy load components and routes
- Optimize images and assets
- Use proper caching strategies
- Implement virtual scrolling for large lists

### Backend Performance
- Use database connection pooling
- Implement proper caching (Redis)
- Use pagination for large datasets
- Monitor and optimize slow queries

### Mobile Performance
- Progressive Web App (PWA) implementation
- Offline functionality for core features
- Optimize for low-bandwidth connections
- Use service workers for caching

## Accessibility Standards

### WCAG 2.1 AA Compliance
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios meet standards
- Alternative text for images
- Focus management for dynamic content

### Internationalization
- Support for multiple languages
- RTL language support
- Proper date/time formatting
- Currency and number formatting

## Development Workflow

### Git Standards
- Use conventional commit messages
- Feature branch workflow
- Require pull request reviews
- Automated testing in CI/CD pipeline

### Code Review Standards
- Review for security vulnerabilities
- Check for performance implications
- Verify test coverage
- Ensure documentation is updated

### Deployment Standards
- Use environment-specific configurations
- Implement proper health checks
- Use blue-green deployment strategy
- Monitor application metrics post-deployment