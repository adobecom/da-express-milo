## Errors

The service layer uses standardized error types to keep handling consistent
across plugins, providers, and middleware.

### Core Error Types
Defined in `services/core/Errors.js`:
- `ServiceError` (base class, includes `code`, `serviceName`, `topic`)
- `AuthenticationError` for auth-required cases
- `ApiError` for HTTP failures (includes `statusCode`, `responseBody`)
- `ValidationError` for input issues (includes `field`)
- `NotFoundError` for missing topic handlers
- `PluginRegistrationError` for duplicate plugin registration (includes `pluginName`)
- `ProviderRegistrationError` for duplicate provider registration (includes `providerName`)

### Serialization

All `ServiceError` instances support `toJSON()` for logging and serialization:

```javascript
const error = new ValidationError('Invalid input', { field: 'name' });
console.log(JSON.stringify(error));
// { "name": "ValidationError", "message": "Invalid input", "code": "VALIDATION_ERROR", ... }
```

Properties included: `name`, `message`, `code`, `serviceName`, `topic`, `timestamp`.

### Where Errors Are Raised
- `BasePlugin.dispatch()` throws `NotFoundError` if a topic is missing.
- `BaseApiService.handleResponse()` throws `ApiError` for non-OK responses.
- `auth.middleware.js` throws `AuthenticationError` if not signed in.
- `ServiceManager` throws `PluginRegistrationError` on duplicate plugin registration.
- `ServiceManager` throws `ProviderRegistrationError` on duplicate provider registration.

### Error Middleware
The `error.middleware.js`:
- Wraps unknown errors in `ServiceError`.
- Adds `serviceName` and `topic` context.
- Logs with `lana` when available.

### Provider Logging
`BaseProvider.logError()` extracts `ServiceError` codes to improve analytics
categorization and tags errors by provider + operation.
