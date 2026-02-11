## Testing Action Groups

> **Applies to:** Pattern A plugins using `BaseActionGroup` (currently kuler, stock)

### Core Testing Framework

Action groups must be tested for these core aspects (apply as relevant):

1. **Structural Correctness** — Verify `getHandlers()` returns all expected topics
2. **Delegation Wiring** — Verify actions call plugin methods correctly (see [Delegation Wiring Pattern](./test-helpers.md#delegation-wiring-pattern))
3. **Validation** — Verify input validation (if actions accept parameters)
4. **Data Transformation** — Verify transformation logic (filtering, grouping, sorting, mapping, etc. if applicable)
5. **Defensive Handling** — Verify handling of malformed API responses (errors at this layer propagate up to the provider `safeExecute` boundary)

### Setup Pattern

All action group classes for a plugin live in a single file using named exports
(e.g. `{PluginName}Actions.js`). Import the specific class(es) you need:

```javascript
// express/test/services/myPlugin/actions/MyPluginActions.test.js
import {
  FooActions,
  BarActions,
} from '../../../../code/libs/services/plugins/myPlugin/actions/MyPluginActions.js';
import { MyTopics } from '../../../../code/libs/services/plugins/myPlugin/topics.js';
import { ValidationError } from '../../../../code/libs/services/core/Errors.js';

// Define mock data matching actual API response structure
const mockData = {
  /* structure matching your API response */
};

describe('FooActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    // Create mock plugin with stubbed methods
    mockPlugin = {
      methodName: sinon.stub().resolves(mockData),
    };
    actions = new FooActions(mockPlugin);
  });

  afterEach(() => sinon.restore());
});

describe('BarActions', () => {
  // Same pattern for the next action group class
});
```

### 1. Structural Correctness (`getHandlers`)

**Purpose:** Verify `getHandlers()` returns handler for every expected topic.

**Pattern:**
- Verify all topics from `Topics.[GROUP]` have handlers (and are functions)
- Verify no unexpected topic keys exist

```javascript
describe('getHandlers - action routing', () => {
  it('should return a handler for every MyTopics.[GROUP] topic', () => {
    const handlers = actions.getHandlers();
    const expectedTopics = Object.values(MyTopics.[GROUP]);

    expectedTopics.forEach((topic) => {
      expect(handlers).to.have.property(topic).that.is.a('function');
    });
  });

  it('should not contain any unexpected topic keys', () => {
    const handlers = actions.getHandlers();
    const handlerKeys = Object.keys(handlers);
    const expectedTopics = Object.values(MyTopics.[GROUP]);

    expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
    handlerKeys.forEach((key) => {
      expect(expectedTopics).to.include(key);
    });
  });
});
```

### 2. Delegation Wiring

See [Delegation Wiring Pattern](./test-helpers.md#delegation-wiring-pattern). Apply it to each action method:

```javascript
describe('[actionMethod]', () => {
  it('should return data from plugin', async () => {
    const result = await actions.actionMethod();
    expect(result).to.deep.equal(mockData);
    expect(mockPlugin.methodName.calledOnce).to.be.true;
  });

  it('should pass arguments correctly', async () => {
    await actions.actionMethod('arg1', 'arg2');
    expect(mockPlugin.methodName.calledWith('arg1', 'arg2')).to.be.true;
  });
});
```

### 3. Validation Testing

**Purpose:** Verify input validation for actions that accept parameters.

**Pattern:**
- Test invalid inputs throw `ValidationError` with helpful messages (include invalid value and valid options)
- Test error metadata (field, serviceName, topic) and verify all valid inputs don't throw
- Use the shared `expectValidationError` helper (see [Shared Test Helpers](./test-helpers.md#expectvalidationerror))

```javascript
describe('[actionMethod] - validation', () => {
  // Test invalid inputs
  [
    { label: 'completely invalid input', input: 'INVALID' },
    { label: 'empty string', input: '' },
    { label: 'wrong type', input: 123 },
    // Add more invalid cases specific to your action
  ].forEach(({ label, input }) => {
    it(`should throw ValidationError for ${label}`, async () => {
      await expectValidationError(() => actions.actionMethod(input));
    });
  });

  // Test error message includes helpful information
  it('should include invalid value and valid options in error message', async () => {
    await expectValidationError(
      () => actions.actionMethod('INVALID'),
      (err) => {
        expect(err.message).to.include('INVALID');
        // Verify valid options are mentioned
        Object.values(ValidOptions).forEach((option) => {
          expect(err.message).to.include(option);
        });
      },
    );
  });

  // Test error metadata
  it('should set correct error metadata on ValidationError', async () => {
    await expectValidationError(
      () => actions.actionMethod('BAD'),
      (err) => {
        expect(err.field).to.equal('[fieldName]');
        expect(err.serviceName).to.equal('[ServiceName]');
        expect(err.topic).to.equal(MyTopics.[GROUP].[TOPIC]);
      },
    );
  });

  // Test all valid inputs
  it('should NOT throw for every valid input value', async () => {
    for (const value of Object.values(ValidOptions)) {
      const result = await actions.actionMethod(value);
      expect(result).to.have.property('[expectedProperty]');
    }
  });
});
```

### 4. Data Transformation

**Purpose:** Verify data transformation logic works correctly (if applicable). Common patterns include filtering, grouping, sorting, mapping, or other transformations.

**Pattern:**
- Test transformation returns correct results (filtered subset, grouped buckets, sorted order, etc.)
- Test no data leakage between groups/filters and edge cases (empty results, missing data)

```javascript
// Example: Filtering pattern
describe('[actionMethod] - filtering', () => {
  // Test each filter value
  [
    { filter: '[FILTER_VALUE_A]', expectedCount: 2 },
    { filter: '[FILTER_VALUE_B]', expectedCount: 1 },
  ].forEach(({ filter, expectedCount }) => {
    it(`should return correct items (${expectedCount}) when filtered by ${filter}`, async () => {
      const result = await actions.actionMethod(filter);
      expect(result.items).to.have.lengthOf(expectedCount);
      // Verify all items match the filter criteria
      result.items.forEach((item) => {
        expect(item.[filterProperty]).to.equal(filter);
      });
    });
  });

  // Test empty results
  it('should return empty array when filter has no matches', async () => {
    mockPlugin.methodName.resolves({ items: [{ [filterProperty]: '[OTHER_VALUE]' }] });
    const result = await actions.actionMethod('[FILTER_VALUE_A]');
    expect(result.items).to.deep.equal([]);
  });
});

// Example: Grouping pattern
describe('[actionMethod] - grouping', () => {
  it('should bucket all items into the correct groups', async () => {
    const result = await actions.actionMethod();
    expect(result.[groupKeyA].items).to.have.lengthOf(2);
    expect(result.[groupKeyB].items).to.have.lengthOf(1);
  });

  it('should not leak items between groups', async () => {
    const result = await actions.actionMethod();
    result.[groupKeyA].items.forEach((item) => {
      expect(item.[groupProperty]).to.equal('[GROUP_VALUE_A]');
    });
    result.[groupKeyB].items.forEach((item) => {
      expect(item.[groupProperty]).to.equal('[GROUP_VALUE_B]');
    });
  });

  // Test edge cases
  [
    { label: 'empty array', data: { items: [] } },
    { label: 'missing items property', data: {} },
  ].forEach(({ label, data }) => {
    it(`should return all group keys with empty items for ${label}`, async () => {
      mockPlugin.methodName.resolves(data);
      const result = await actions.actionMethod();
      expect(result).to.have.all.keys('[groupKeyA]', '[groupKeyB]');
      Object.values(result).forEach((group) => {
        expect(group.items).to.deep.equal([]);
      });
    });
  });
});

// Note: Adapt these examples to your specific transformation needs (sorting, mapping, etc.)
```

### 5. Defensive Data Handling

**Purpose:** Verify handling of malformed API responses. Unhandled errors at this layer will propagate up to the provider's `safeExecute` boundary (if one exists), but action groups should still handle known edge cases gracefully rather than relying on the provider to catch them.

**Pattern:**
- Test handling of `null` responses, empty objects, missing properties, and malformed data structures

```javascript
describe('[actionMethod] - malformed API responses', () => {
  [
    { label: 'null', data: null },
    { label: 'empty object', data: {} },
    { label: 'null [dataArray]', data: { [dataArray]: null } },
    { label: 'missing expected property', data: { [otherProperty]: '[value]' } },
  ].forEach(({ label, data }) => {
    it(`should handle ${label} gracefully`, async () => {
      mockPlugin.methodName.resolves(data);
      const result = await actions.actionMethod();
      // Verify graceful handling - return empty array, default value, etc.
      expect(result.[dataArray]).to.deep.equal([]);
    });
  });
});
```
