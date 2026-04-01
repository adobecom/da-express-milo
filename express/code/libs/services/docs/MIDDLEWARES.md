## Middlewares

Middlewares run cross-cutting behavior around every action dispatch, similar to an HTTP middleware chain.

### Middleware Signature
```
async function middleware(topic, args, next, context) => result
```
- `topic`: action topic string.
- `args`: array of action arguments.
- `next`: calls the next middleware or handler.
- `context`: optional metadata provided by `buildContext`.

### Context Builders
Middlewares can expose a static `buildContext(meta)` that receives `{ plugin, serviceName, topic, args }` and returns context passed to the middleware. Plugins can override `middlewareContextTransform()` to enrich or redact.

### Order and Scope
- Global middleware: `config.middleware`.
- Per-plugin middleware: `config.services[plugin].middleware`.
- Executes in array order.

### Built-in Middlewares
`services/middlewares/` includes:
- `error.middleware.js` — standardized error wrapping + analytics logging.
- `logging.middleware.js` — request/response timing logs.
- `auth.middleware.js` — enforces authenticated access. Checks `adobeIMS.isSignedInUser()` and, when the user is not signed in, reads the page's `susi-target` metadata to optionally open a SUSI-light sign-in modal before throwing `AuthenticationError`. Can be applied to all topics (string form) or scoped to specific topics using the conditional middleware config (object form). Dispatches the `service:ims:ready` event once the IMS SDK is available (see below).
- `guard.js` — `guardMiddleware()` and `matchTopic()` utilities for conditional middleware.

### IMS Ready Event (`service:ims:ready`)

The auth middleware exposes an `IMS_READY_EVENT` constant (`'service:ims:ready'`)
that is dispatched on `window` **exactly once** when `ensureIms()` confirms the
IMS SDK is available. This event is the canonical signal that IMS is ready and
replaces any reliance on non-standard events.

Standalone providers (e.g. `AuthStateProvider`) listen for this event to
initialize without creating a dependency on the IMS loader itself.

```javascript
import { IMS_READY_EVENT } from './middlewares/auth.middleware.js';

window.addEventListener(IMS_READY_EVENT, () => {
  // IMS is ready — window.adobeIMS is available
}, { once: true });
```

The event is dispatched at most once per page lifecycle. After `resetImsState()`
(tests only), the flag resets so the event can fire again on the next
`ensureIms()` call.

### SUSI Modal Login Redirection

When the auth middleware detects an unauthenticated user, it checks for a
`susi-target` metadata tag on the page. If present, it opens a SUSI-light
sign-in modal before throwing `AuthenticationError`.

The metadata value should be a fragment path with a hash identifier:

```html
<meta name="susi-target" content="/express/fragments/susi-light#susi-light">
```

The middleware splits this into `path` and `id`, then uses milo's `getModal()`
to display the sign-in dialog:

```javascript
const [path, hash] = susiTarget.split('#');
const { getModal } = await import(`${getLibs()}/blocks/modal/modal.js`);
await getModal({ id: hash, path });
```

If no `susi-target` metadata is present, the middleware throws
`AuthenticationError` immediately without showing a modal.

### Failure Behavior
If a middleware throws, the chain stops and the error propagates. The error middleware standardizes errors into `ServiceError` with context.

### Conditional Middleware (Topic-Level Control)

Scope a middleware to specific topics using the object form in the config array.

#### Config Syntax

| Form | Example | Behavior |
|------|---------|----------|
| **String** | `'auth'` | Runs for all topics |
| **Object with `topics`** | `{ name: 'auth', topics: ['theme.*'] }` | Only matching topics |
| **Object with `excludeTopics`** | `{ name: 'auth', excludeTopics: ['search.*'] }` | All topics except matching |

#### Topic Patterns

| Pattern | Matches | Does not match |
|---------|---------|----------------|
| `'theme.save'` | `theme.save` | `theme.delete`, `search.themes` |
| `'theme.*'` | `theme.save`, `theme.delete`, `theme.get` | `search.themes`, `gradient.save` |
| `'search.*'` | `search.themes`, `search.gradients` | `theme.save` |

#### Example

```javascript
// Only write operations require auth
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

String entries are normalized to `{ name: '...' }`. When `topics` or `excludeTopics` is present, the middleware is auto-wrapped with `guardMiddleware()` which calls `next()` directly on non-matching topics.

### Programmatic Guards

| Function | Signature | Description |
|----------|-----------|-------------|
| `guardMiddleware` | `(predicate, middleware) → middleware` | Wraps a middleware; bypasses via `next()` when `predicate(topic, context)` returns `false`. Preserves `buildContext`. Throws `TypeError` if args are not functions. |
| `matchTopic` | `(pattern, topic) → boolean` | Matches exact (`'theme.save'`) or wildcard suffix (`'theme.*'`) patterns. |

```javascript
import { guardMiddleware, matchTopic } from './middlewares/guard.js';
import authMiddleware from './middlewares/auth.middleware.js';

const guardedAuth = guardMiddleware(
  (topic) => ['theme.*', 'gradient.*'].some((p) => matchTopic(p, topic)),
  authMiddleware,
);
plugin.use(guardedAuth);
```

### Creating Custom Middleware

Use the standard signature. Optionally attach a static `buildContext(meta)` for context enrichment.

To register:
- Add loader to `ServiceManager.#middlewareLoaders`
- Add feature flag (e.g. `ENABLE_RATELIMIT: true`) to config
- Add name to `config.middleware` array
