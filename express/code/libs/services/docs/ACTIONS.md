## Actions

Actions are the handler implementations for topics. They live in action
groups, which organize related handlers in a plugin.

### BaseActionGroup
`BaseActionGroup`:
- Stores a reference to the owning plugin.
- Requires `getHandlers()` to return a map of topic -> handler.
- Provides a static `getRegisteredGroupNames(plugin)` helper.

### Registration Flow
1. Create an action group class that extends `BaseActionGroup`.
2. Implement `getHandlers()` with bound methods.
3. In the plugin constructor, call `registerActionGroup(name, group)`.
4. `BasePlugin` registers handlers into `topicRegistry`.

### Input Shapes
Actions typically accept "criteria" objects. Common helpers:
- `searchTransform(query, options)` in `providers/transforms.js`
- `stockTransform(params)` in `providers/transforms.js`

### Examples
- `plugins/kuler/actions/SearchActions.js`
  - Provides theme, gradient, and published search actions.
- `plugins/stock/actions/StockActions.js`
  - Provides Stock search and curated gallery actions.

### Calling Actions
Use `plugin.dispatch()` for raw access or provider methods for safe calls.
Providers should be preferred for UI code.
