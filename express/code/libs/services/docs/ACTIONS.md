## Actions

Actions are the handler implementations for topics. They live in action
groups, which organize related handlers in a plugin.

### BaseActionGroup
`BaseActionGroup`:
- Stores a reference to the owning plugin.
- Requires `getHandlers()` to return a map of topic -> handler.
- Provides a static `getRegisteredGroupNames(plugin)` helper.

### Registration Flow
1. Create action group classes that extend `BaseActionGroup`.
2. **Place all action group classes in a single file** —
   `plugins/{name}/actions/{PluginName}Actions.js` — using named exports.
   This avoids request waterfalls from multiple small module fetches.
3. Implement `getHandlers()` with bound methods in each class.
4. In the plugin constructor, call `registerActionGroup(name, group)` for each.
5. `BasePlugin` registers handlers into `topicRegistry`.

### Input Shapes
Actions typically accept "criteria" objects. Common helpers:
- `searchTransform(query, options)` in `providers/transforms.js`
- `stockTransform(params)` in `providers/transforms.js`

### Examples
- `plugins/kuler/actions/SearchActions.js`
  - Provides theme, gradient, and published search actions.
- `plugins/stock/actions/StockActions.js`
  - Provides all Stock action groups (Search, Gallery, Data, Redirect) in a
    single file as named exports.

### Calling Actions
Use `plugin.dispatch()` for raw access or provider methods for safe calls.
Providers should be preferred for UI code.
