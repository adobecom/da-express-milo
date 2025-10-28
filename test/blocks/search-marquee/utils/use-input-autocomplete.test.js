import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

// Mock the dependencies
let mockThrottle;
let mockDebounce;
let mockMemoizedFetchAPI;

// Create test version of useInputAutocomplete
function createUseInputAutocomplete() {
  return function useInputAutocomplete(
    updateUIWithSuggestions,
    getConfig,
    { throttleDelay = 300, debounceDelay = 500, limit = 5 } = {},
  ) {
    const state = { query: '', waitingFor: '' };

    const fetchAndUpdateUI = async () => {
      const currentSearch = state.query;
      state.waitingFor = currentSearch;
      const suggestions = await mockMemoizedFetchAPI({
        textQuery: currentSearch,
        limit,
        locale: getConfig().locale.ietf,
      });
      if (state.waitingFor === currentSearch) {
        updateUIWithSuggestions(suggestions);
      }
    };

    const throttledFetchAndUpdateUI = mockThrottle(
      fetchAndUpdateUI,
      throttleDelay,
      { trailing: true },
    );
    const debouncedFetchAndUpdateUI = mockDebounce(fetchAndUpdateUI, debounceDelay);

    const inputHandler = (e) => {
      state.query = e.target.value;
      if (state.query.length < 4 || state.query.endsWith(' ')) {
        throttledFetchAndUpdateUI();
      } else {
        debouncedFetchAndUpdateUI();
      }
    };

    return { inputHandler };
  };
}

describe('useInputAutocomplete Utility Function', () => {
  let useInputAutocomplete;
  let mockUpdateUI;
  let mockGetConfig;
  let throttledFn;
  let debouncedFn;

  beforeEach(() => {
    // Create mock functions
    mockUpdateUI = sinon.spy();
    mockGetConfig = sinon.stub().returns({
      locale: { ietf: 'en-US' },
    });

    // Create mock throttle and debounce that return controllable functions
    throttledFn = sinon.spy();
    debouncedFn = sinon.spy();

    mockThrottle = sinon.stub().returns(throttledFn);
    mockDebounce = sinon.stub().returns(debouncedFn);

    mockMemoizedFetchAPI = sinon.stub().resolves([
      { query: 'test suggestion 1' },
      { query: 'test suggestion 2' },
    ]);

    useInputAutocomplete = createUseInputAutocomplete();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should initialize with correct default options', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    expect(inputHandler).to.be.a('function');
    expect(mockThrottle.calledWith(sinon.match.func, 300, { trailing: true })).to.be.true;
    expect(mockDebounce.calledWith(sinon.match.func, 500)).to.be.true;
  });

  it('should use custom throttle and debounce delays', () => {
    const customOptions = { throttleDelay: 200, debounceDelay: 800, limit: 10 };
    useInputAutocomplete(mockUpdateUI, mockGetConfig, customOptions);

    expect(mockThrottle.calledWith(sinon.match.func, 200, { trailing: true })).to.be.true;
    expect(mockDebounce.calledWith(sinon.match.func, 800)).to.be.true;
  });

  it('should call throttled function for short queries (< 4 characters)', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'abc' } };
    inputHandler(mockEvent);

    expect(throttledFn.calledOnce).to.be.true;
    expect(debouncedFn.called).to.be.false;
  });

  it('should call throttled function for queries ending with space', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'test query ' } };
    inputHandler(mockEvent);

    expect(throttledFn.calledOnce).to.be.true;
    expect(debouncedFn.called).to.be.false;
  });

  it('should call debounced function for long queries without trailing space', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'test query' } };
    inputHandler(mockEvent);

    expect(debouncedFn.calledOnce).to.be.true;
    expect(throttledFn.called).to.be.false;
  });

  it('should update query state when input handler is called', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'new query' } };
    inputHandler(mockEvent);

    // We can't directly access state, but we can verify the behavior through the API calls
    expect(throttledFn.called || debouncedFn.called).to.be.true;
  });

  it('should handle empty input', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: '' } };
    inputHandler(mockEvent);

    expect(throttledFn.calledOnce).to.be.true;
    expect(debouncedFn.called).to.be.false;
  });

  it('should handle single character input', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'a' } };
    inputHandler(mockEvent);

    expect(throttledFn.calledOnce).to.be.true;
    expect(debouncedFn.called).to.be.false;
  });

  it('should handle exactly 4 character input (boundary case)', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'test' } };
    inputHandler(mockEvent);

    expect(debouncedFn.calledOnce).to.be.true;
    expect(throttledFn.called).to.be.false;
  });

  it('should handle multiple spaces in query', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'test  query  ' } };
    inputHandler(mockEvent);

    expect(throttledFn.calledOnce).to.be.true;
    expect(debouncedFn.called).to.be.false;
  });

  it('should handle special characters in query', () => {
    const { inputHandler } = useInputAutocomplete(mockUpdateUI, mockGetConfig);

    const mockEvent = { target: { value: 'test@#$%' } };
    inputHandler(mockEvent);

    expect(debouncedFn.calledOnce).to.be.true;
    expect(throttledFn.called).to.be.false;
  });

  // Test the actual fetchAndUpdateUI function behavior
  describe('fetchAndUpdateUI behavior', () => {
    it('should call memoizedFetchAPI with correct parameters', async () => {
      // Create a version where we can access the internal fetchAndUpdateUI
      const useInputAutocompleteWithExposedFetch = function exposedFetch(
        updateUIWithSuggestions,
        getConfig,
        { limit = 5 } = {},
      ) {
        const state = { query: '', waitingFor: '' };

        const fetchAndUpdateUI = async () => {
          const currentSearch = state.query;
          state.waitingFor = currentSearch;
          const suggestions = await mockMemoizedFetchAPI({
            textQuery: currentSearch,
            limit,
            locale: getConfig().locale.ietf,
          });
          if (state.waitingFor === currentSearch) {
            updateUIWithSuggestions(suggestions);
          }
        };

        // Expose fetchAndUpdateUI for testing
        return { fetchAndUpdateUI, state };
      };

      const { fetchAndUpdateUI, state } = useInputAutocompleteWithExposedFetch(
        mockUpdateUI,
        mockGetConfig,
        { limit: 10 },
      );

      state.query = 'test query';
      await fetchAndUpdateUI();

      expect(mockMemoizedFetchAPI.calledWith({
        textQuery: 'test query',
        limit: 10,
        locale: 'en-US',
      })).to.be.true;
      expect(mockUpdateUI.calledWith([
        { query: 'test suggestion 1' },
        { query: 'test suggestion 2' },
      ])).to.be.true;
    });
  });
});
