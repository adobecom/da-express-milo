## Topics

Topics are string identifiers for actions. Plugins register handlers for
topics, and consumers invoke them via `plugin.dispatch(topic, ...)` or
through provider methods.

### Where Topics Live
Each plugin defines topics in `plugins/<name>/topics.js`:
- `KulerTopics` in `plugins/kuler/topics.js`
- `StockTopics` in `plugins/stock/topics.js`
- Others follow the same pattern

### Structure and Namespacing
Topics are grouped by domain keys and map to string values:
- Grouped by area (e.g., `SEARCH`, `THEME`, `LIKE`).
- String values are dot-delimited (e.g., `search.themes`).
- Names should be generic and functionality-focused.

### Action Groups
Topics are paired with action group identifiers in the same file, such as:
- `KulerActionGroups` (search, theme, gradient, like)
- `StockActionGroups` (stock)

### Dispatch Flow
1. `BasePlugin.dispatch(topic, ...args)` looks up the handler.
2. If missing, throws `NotFoundError`.
3. Middlewares wrap the handler, then the handler runs.

### Example
```
import { KulerTopics } from '../plugins/kuler/topics.js';
await kulerPlugin.dispatch(KulerTopics.SEARCH.THEMES, criteria);
```
