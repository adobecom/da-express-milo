# Sticky Behavior

Utilities for showing a sticky element when a sentinel scrolls out of view. The module supports cloning the original UI into a sticky shell or relocating the original element into a sticky wrapper.

## Exports

- `createStickyBehavior(options)`
- `createAutoStickyBehavior(options)`
- `DEFAULT_CONFIG`

## Modes

### Clone mode

Use clone mode when the sticky UI should be a duplicate of the original element.

```js
const sticky = createStickyBehavior({
  sentinel,
  createClone: () => originalElement.cloneNode(true),
  onSync: (clone) => {
    clone.querySelector('input').value = originalInput.value;
  },
});
```

### Relocate mode

Use relocate mode when the sticky UI should be the original element itself. The utility creates a placeholder to preserve layout, creates a wrapper, and moves the element in and out of that wrapper as visibility changes.

```js
const sticky = createStickyBehavior({
  sentinel,
  element: searchContainer,
  createWrapper: createStickyWrapper,
  onHide: () => {
    hideSuggestions();
  },
});
```

## Options

- `sentinel`: required `HTMLElement` observed by `IntersectionObserver`.
- `createClone`: clone factory for clone mode. Must return an `HTMLElement`.
- `element`: original element to relocate in relocate mode.
- `createWrapper`: optional wrapper factory for relocate mode. Defaults to a fixed-position wrapper with `z-index: 100`.
- `onShow`: callback fired when the sticky UI becomes visible.
- `onHide`: callback fired when the sticky UI is hidden.
- `onSync`: callback used to sync clone state before showing and when `sync()` is called.
- `animation.duration`: leave animation duration in milliseconds. Default: `200`.
- `animation.visibleClass`: class applied while the sticky UI is visible. Default: `is-visible`.
- `animation.leavingClass`: class applied while the sticky UI is leaving. Default: `is-leaving`.
- `observer.root`: optional scroll container. Default: `null`.
- `observer.rootMargin`: `IntersectionObserver` root margin. Default: `0px 0px 0px 0px`.
- `observer.threshold`: `IntersectionObserver` threshold. Default: `0`.
- `stickyClass`: class applied to the sticky element or wrapper. Default: `is-sticky-clone`.
- `appendTo`: container element or factory used to place the sticky element. Defaults to `document.body`.

At least one rendering strategy is required:

- clone mode: `createClone`
- relocate mode: `element`

Validation also requires `sentinel` to be an `HTMLElement`.

## API

- `init(scrollRoot = config.observer.root)`: creates the observer and starts watching the sentinel. Reinitializes cleanly if called again.
- `destroy()`: disconnects observers, clears timeouts, removes sticky DOM, and is safe to call multiple times.
- `show()`: forces the sticky UI to appear.
- `hide()`: hides the sticky UI using the configured leave animation.
- `sync()`: reruns `onSync` for clone mode. No-op in relocate mode.
- `getElement()`: returns the sticky clone in clone mode or the original relocated element in relocate mode.
- `getWrapper()`: returns the sticky wrapper or clone container that the utility manages.
- `isVisible()`: returns the current visibility state.
- `isInitialized()`: returns whether the observer is active.

## Lifecycle Notes

- Sticky DOM is created lazily on first show.
- In relocate mode, the placeholder is inserted next to the original element before any sticky transition happens.
- During hide in relocate mode, wrapper dimensions are temporarily locked so the leave animation can complete without the wrapper collapsing.
- `createAutoStickyBehavior()` wraps `createStickyBehavior()` and delays `init()` until the sentinel is connected to the document using a `MutationObserver`.
