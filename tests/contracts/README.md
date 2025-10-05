# API Contract Tests

This directory contains contract tests for all API endpoints using Zod schemas. These tests ensure that:

1. **Request validation**: All incoming requests match expected schemas
2. **Response validation**: All API responses conform to documented schemas
3. **Type safety**: TypeScript types are generated from these schemas
4. **Documentation**: Schemas serve as living documentation for the API

## Structure

- `user.schema.test.ts` - User authentication and profile endpoints
- `learn.schema.test.ts` - Learning content endpoints
- `chat.schema.test.ts` - Chat and translation endpoints

## Usage

### Running Tests

```bash
# Run all contract tests
npm test tests/contracts

# Run specific contract test
npm test tests/contracts/user.schema.test.ts
```

### Using Schemas in Code

```typescript
import { loginRequestSchema, loginResponseSchema } from '@/tests/contracts/user.schema.test';

// In your API handler
export async function loginHandler(req: Request) {
  // Validate request
  const data = loginRequestSchema.parse(await req.json());
  
  // Process login...
  const response = {
    user: { /* ... */ },
    accessToken: generateToken(),
    // ...
  };
  
  // Validate response before sending
  return loginResponseSchema.parse(response);
}
```

### Adding New Endpoints

1. Create schema for request (if applicable)
2. Create schema for response
3. Write tests covering:
   - Valid requests/responses
   - Invalid cases
   - Edge cases
4. Export schemas for use in implementation

## Best Practices

1. **Be strict**: Prefer explicit validation over loose schemas
2. **Document constraints**: Use Zod's built-in validators (min, max, regex, etc.)
3. **Test edge cases**: Empty strings, special characters, boundary values
4. **Version carefully**: Breaking changes to schemas = breaking API changes
5. **Reuse schemas**: Extract common patterns into shared schemas