# Search Marquee Block - Function Documentation

## Functions

### `preloadLCPImage(imageUrl)`
Preloads an LCP (Largest Contentful Paint) image to improve page performance.

**Parameters:**
- `imageUrl` (string) - The URL of the image to preload

---

### `getManualLinksPayload()`
Retrieves manual links payload from BlockMediator or window object.

**Returns:**
- `Object|undefined` - The manual links payload or undefined

---

### `clearManualLinksPayload()`
Clears manual links payload from both BlockMediator and window object.

---

### `shouldInjectLogo(block)`
Determines whether the Express logo should be injected into the search marquee block.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element

**Returns:**
- `boolean` - True if logo should be injected, false otherwise

---

### `handlelize(str)`
Converts a string to a URL-friendly handle format. Removes accents, replaces spaces/special chars with hyphens, and lowercases.

**Parameters:**
- `str` (string) - The string to convert

**Returns:**
- `string` - The handleized string

---

### `wordExistsInString(word, inputString)`
Checks if a word exists in a string as a whole word (not as part of another word).

**Parameters:**
- `word` (string) - The word to search for
- `inputString` (string) - The string to search in

**Returns:**
- `boolean` - True if word exists as whole word, false otherwise

---

### `cycleThroughSuggestions(block, targetIndex = 0)`
Focuses on a suggestion item at the specified index in the suggestions list.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element
- `targetIndex` (number) - The index of the suggestion to focus (default: 0)

---

### `initSearchFunction(block, searchBarWrapper)`
Initializes search functionality including event handlers for search bar, autocomplete suggestions, and search submission.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element
- `searchBarWrapper` (HTMLElement) - The search bar wrapper element

---

### `decorateSearchFunctions(block)`
Creates and decorates the search bar and form elements for the search marquee block.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element

**Returns:**
- `Promise<HTMLElement>` - The search bar wrapper element

---

### `decorateBackground(block)`
Decorates the background of the search marquee block. Handles gradient backgrounds, picture elements, or fallback image from anchor href.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element

---

### `buildSearchDropdown(block, searchBarWrapper)`
Builds the search dropdown container with trends, suggestions, and free plan widget.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element
- `searchBarWrapper` (HTMLElement) - The search bar wrapper element

---

### `buildManualLinkList(block, manualData)`
Builds and renders a manual link list carousel from provided data.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element
- `manualData` (Object) - The manual links data object

**Returns:**
- `Promise<boolean>` - True if links were rendered, false otherwise

---

### `waitForManualLinks(block)`
Waits for manual links payload to become available via BlockMediator or custom event.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element

**Returns:**
- `Promise<boolean>` - True if links were loaded, false if timeout

---

### `decorateLinkList(block)`
Decorates the link list carousel for the search marquee block. Handles both manual links and dynamically generated links from template data.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element

---

### `decorate(block)`
Main decoration function for the search marquee block. Initializes all components including background, search bar, dropdown, and link list.

**Parameters:**
- `block` (HTMLElement) - The search marquee block element
