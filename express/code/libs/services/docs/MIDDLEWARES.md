## Middlewares

Middlewares allow cross-cutting behavior around every action dispatch,
similar to an HTTP middleware chain.

### Middleware Signature
```
async function middleware(topic, args, next, context) => result
```
- `topic`: action topic string.
- `args`: array of action arguments.
- `next`: calls the next middleware or handler.
- `context`: optional metadata provided by `buildContext`.

### Context Builders
Middlewares can expose a static `buildContext(meta)`:
- `meta` includes `{ plugin, serviceName, topic, args }`.
- Returned context is passed to the middleware as `context`.
- Plugins can override `middlewareContextTransform()` to enrich or redact.

### Order and Scope
- Global middleware comes from `config.middleware`.
- Per-plugin middleware can be set in `config.services[plugin].middleware`.
- Order matters: middleware executes in array order.

### Built-in Middlewares
`services/integration/middlewares/` includes:
- `error.middleware.js` for standardized error wrapping + analytics logging.
- `logging.middleware.js` for request/response timing logs.
- `auth.middleware.js` to enforce authenticated access.

### Failure Behavior
If a middleware throws, the chain stops and the error propagates. The error
middleware standardizes errors into `ServiceError` with context.

### Creating Custom Middleware

Custom middleware follows the same signature as built-in middleware:

```javascript
// middlewares/rateLimit.middleware.js
const requestCounts = new Map();

export default async function rateLimitMiddleware(topic, args, next, context = {}) {
  const key = `${context.serviceName}:${topic}`;
  const count = requestCounts.get(key) || 0;
  
  if (count > 100) {
    throw new ServiceError('Rate limit exceeded', { code: 'RATE_LIMITED' });
  }
  
  requestCounts.set(key, count + 1);
  return next();
}

rateLimitMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
```

To enable:
1. Add loader to `ServiceManager.#middlewareLoaders`
2. Add feature flag `ENABLE_RATELIMIT: true` to config
3. Add `'rateLimit'` to `config.middleware` array

