z'z# Integration Tests

This directory contains integration tests for the Better SaaS application. Integration tests verify that different components of the system work together correctly.

## Overview

Our integration test suite covers:

- **API Endpoints** - Testing HTTP API functionality
- **Database Operations** - Testing data persistence and queries
- **Service Layer** - Testing business logic and workflows
- **Authentication** - Testing auth flows and session management
- **Payment Processing** - Testing Stripe integration and billing

## Test Structure

```
tests/integration/
├── api/                    # API endpoint tests
│   ├── health.test.ts      # ✅ Health check API (6 tests)
│   ├── payment-api.test.ts # ✅ Payment/billing API (17 tests)
│   ├── auth-api.test.ts    # ⚠️ Authentication API (pending fix)
│   └── file-api.test.ts    # ⚠️ File management API (pending fix)
├── database/               # Database integration tests
│   ├── user-operations.test.ts    # ✅ User CRUD operations (13 tests)
│   └── real-database.test.ts      # ✅ Database connectivity (6 tests)
├── services/               # Service layer tests
│   ├── auth-service.test.ts       # ✅ Authentication service (17 tests)
│   └── file-upload.test.ts        # ✅ File upload service (15 tests)
└── README.md              # This file
```

## Test Status Summary

### ✅ Completed Tests (78 total tests)

1. **Health API Tests** (6 tests)
   - API response validation
   - Health status checks
   - Response time testing

2. **Payment API Tests** (17 tests)
   - Subscription creation and cancellation
   - Billing information retrieval
   - Payment method management
   - Invoice handling
   - Stripe integration mocking

3. **Authentication Service Tests** (17 tests)
   - User registration and validation
   - Login/logout workflows
   - Session management
   - Password changes
   - Account deletion

4. **Database User Operations** (13 tests)
   - User CRUD operations
   - File operations with permissions
   - Session management
   - Data validation

5. **Database Connectivity** (6 tests)
   - Connection health
   - Transaction support
   - Error handling

6. **File Upload Service** (15 tests)
   - File upload workflows
   - File validation
   - Storage operations
   - Permission checks

### ⚠️ Pending Fixes (32 tests)

1. **File API Tests** (16 tests) - ⚠️ Requires polyfill fixes
   - Issue: `TextEncoderStream is not defined` in Next.js server
   - Status: Need to resolve Edge Runtime polyfills

2. **Authentication API Tests** (16 tests) - ⚠️ Depends on File API fix
   - Issue: Server startup problems
   - Status: Waiting for polyfill resolution

## Running Tests

### All Integration Tests
```bash
pnpm test:integration
```

### Specific Test Files
```bash
# API tests
pnpm jest tests/integration/api/health.test.ts
pnpm jest tests/integration/api/payment-api.test.ts

# Service tests
pnpm jest tests/integration/services/auth-service.test.ts

# Database tests
pnpm jest tests/integration/database/user-operations.test.ts
```

### Test Environment

Integration tests use:
- **Test Database**: Isolated test database instance
- **Mock Services**: Stripe, file storage, external APIs
- **Test Environment**: `NODE_ENV=test` with `.env.test` configuration

## Test Configuration

### Jest Setup
- **Environment**: jsdom (with Node.js polyfills)
- **Timeout**: 30 seconds for integration tests
- **Setup Files**: 
  - `tests/setup/jest.setup.js` - Global test setup
  - `tests/setup/performance-polyfill.js` - Performance API polyfills

### Database Setup
- **Driver**: Neon HTTP driver for serverless compatibility
- **Migrations**: Automatic schema setup
- **Cleanup**: Automatic cleanup between tests

## Known Issues

### 1. Next.js Edge Runtime Polyfills
- **Problem**: Missing Web API polyfills in test environment
- **Affected**: File API and Auth API tests
- **Workaround**: Created polyfill files, but need deeper integration

### 2. Database Limitations
- **Problem**: Neon HTTP driver limitations (no transactions, limited aggregations)
- **Impact**: Some advanced database features can't be tested
- **Status**: Documented and accepted limitation

## Best Practices

### Writing Integration Tests

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Mocking**: Mock external services (Stripe, file storage)
4. **Realistic Data**: Use realistic test data and scenarios
5. **Error Cases**: Test both success and failure scenarios

### Test Structure
```typescript
describe('Feature Integration Tests', () => {
  beforeEach(() => {
    // Setup mocks and test data
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Happy Path', () => {
    it('should handle normal operation', async () => {
      // Test implementation
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Error test implementation
    });
  });
});
```

### Mock Guidelines

1. **Service Mocks**: Mock external services completely
2. **Database Mocks**: Use real database for integration tests
3. **API Mocks**: Mock third-party APIs (Stripe, etc.)
4. **Consistent Mocking**: Use consistent mock data across tests

## Future Improvements

### Short Term
1. Fix Next.js polyfill issues for File and Auth API tests
2. Add more service layer integration tests
3. Improve test performance and reliability

### Long Term
1. Add end-to-end test scenarios
2. Implement test data factories
3. Add performance benchmarking
4. Integrate with CI/CD pipeline

## Contributing

When adding new integration tests:

1. Follow the existing directory structure
2. Use descriptive test names and organize by feature
3. Include both success and error scenarios
4. Add appropriate mocks for external dependencies
5. Update this README with new test information

## Support

For questions about integration tests:
- Check existing test files for examples
- Review Jest configuration in `jest.config.js`
- Check test setup files in `tests/setup/`
- Refer to project documentation 