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
- `error.middleware.js` — standardized error wrapping + analytics logging.
- `logging.middleware.js` — request/response timing logs.
- `auth.middleware.js` — enforces authenticated access. Checks `adobeIMS.isSignedInUser()` and throws `AuthenticationError` if the user is not logged in. Can be applied to all topics (string form) or scoped to specific topics using the conditional middleware config (object form).
- `guard.js` — `guardMiddleware()` and `matchTopic()` utilities for conditional middleware.

### Failure Behavior
If a middleware throws, the chain stops and the error propagates. The error
middleware standardizes errors into `ServiceError` with context.

### Conditional Middleware (Topic-Level Control)

By default, a middleware in a plugin's chain runs for **every** dispatched topic.
To scope a middleware to specific topics, use the **object form** in the middleware
config array instead of a plain string.

#### Config Syntax

Middleware entries support three forms:

| Form | Example | Behavior |
|------|---------|----------|
| **String** | `'auth'` | Runs for all topics (existing behavior) |
| **Object with `topics`** | `{ name: 'auth', topics: ['theme.*'] }` | Only runs for matching topics |
| **Object with `excludeTopics`** | `{ name: 'auth', excludeTopics: ['search.*'] }` | Runs for all topics except matching |

#### Topic Patterns

Topic patterns support exact matches and wildcard suffix matching:

| Pattern | Matches | Does not match |
|---------|---------|----------------|
| `'theme.save'` | `theme.save` | `theme.delete`, `search.themes` |
| `'theme.*'` | `theme.save`, `theme.delete`, `theme.get` | `search.themes`, `gradient.save` |
| `'search.*'` | `search.themes`, `search.gradients` | `theme.save` |

#### Examples

**Only write operations require auth:**
```javascript
// config.js — per-plugin middleware
services: {
  kuler: {
    baseUrl: '...',
    middleware: [
      'error',
      'logging',
      { name: 'auth', topics: ['theme.save', 'theme.delete', 'gradient.*', 'like.*'] },
    ],
  },
}
```

**Everything except search requires auth:**
```javascript
middleware: [
  'error',
  'logging',
  { name: 'auth', excludeTopics: ['search.*'] },
]
```

**Auth for all topics (unchanged behavior):**
```javascript
middleware: ['error', 'logging', 'auth']
```

#### How It Works

The `ServiceManager` normalizes each middleware config entry. String entries (e.g. `'auth'`)
are treated as `{ name: 'auth' }`. When `topics` or `excludeTopics` is present in the
entry object, the middleware is automatically wrapped with `guardMiddleware()` from
`middlewares/guard.js`. The guarded middleware skips execution (calls `next()` directly)
when the current topic does not match the filter. No changes are needed to
`BasePlugin.dispatch()`, topic definitions, or the middleware function itself.

### Programmatic Guards with `guardMiddleware()`

For advanced use cases beyond config-driven filtering, the `guardMiddleware()` utility
and `matchTopic()` helper are exported from `middlewares/guard.js` and can be used
directly when composing middleware programmatically:

```javascript
import { guardMiddleware, matchTopic } from './middlewares/guard.js';
import authMiddleware from './middlewares/auth.middleware.js';

// Auth only for topics starting with 'theme.' or 'gradient.'
const guardedAuth = guardMiddleware(
  (topic) => ['theme.*', 'gradient.*'].some((p) => matchTopic(p, topic)),
  authMiddleware,
);

plugin.use(guardedAuth);
```

#### `guardMiddleware(predicate, middleware)`
- Wraps a middleware with a predicate `(topic, context) => boolean`.
- When the predicate returns `false`, the middleware is bypassed and `next()` is called.
- Returns a new middleware with the same signature `(topic, args, next, context)`.
- Preserves the wrapped middleware's `buildContext` if defined.
- Throws `TypeError` if predicate or middleware is not a function.

#### `matchTopic(pattern, topic)`
- Matches a topic string against a pattern.
- Supports exact matches (`'theme.save'`) and wildcard suffix patterns (`'theme.*'`).
- Returns `boolean`.

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

