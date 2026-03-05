# Blog Posts V2 Block - Function Documentation

## Functions

### `resetBlogCache()`
Reset function for testing purposes. Clears blog results cache and index.

---

### `fetchBlogIndex(locales)`
Fetches blog index data from multiple locales and combines them.

**Parameters:**
- `locales` (Array) - Array of locale prefixes

**Returns:**
- `Object` - Combined blog index with data and byPath lookup

---

### `getFeatured(index, urls)`
Extracts featured blog posts from index based on URLs.

**Parameters:**
- `index` (Object) - Blog index object with byPath lookup
- `urls` (Array) - Array of URLs or pathnames

**Returns:**
- `Array` - Array of featured blog post objects

---

### `isDuplicate(path)`
Checks if a blog post path is already in the blogPosts array.

**Parameters:**
- `path` (string) - Blog post path

**Returns:**
- `boolean` - True if duplicate, false otherwise

---

### `filterBlogPosts(config, index)`
Filters blog posts based on config criteria (featured, tags, author, category).

**Parameters:**
- `config` (Object) - Configuration object with filters
- `index` (Object) - Blog index object

**Returns:**
- `Array` - Filtered array of blog post objects

---

### `getSafeHrefFromText(text)`
Safely extracts a valid HTTP/HTTPS URL from text.

**Parameters:**
- `text` (string) - Text that may contain a URL

**Returns:**
- `string|null` - Valid URL or null

---

### `normalizeConfigUrls(config)`
Normalizes URLs in config to pathnames only (for cross-environment comparison).

**Parameters:**
- `config` (Object) - Configuration object

**Returns:**
- `Object` - Normalized configuration object

---

### `getBlogPostsConfig(block)`
Given a block element, construct a config object from all the links that are children of the block.

**Parameters:**
- `block` (HTMLElement) - The blog posts block element

**Returns:**
- `Object` - Configuration object

---

### `extractHeadingContent(block)`
Extracts heading and view-all link content from block for include-heading variant.

**Parameters:**
- `block` (HTMLElement) - The blog posts block element

**Returns:**
- `Object|null` - Object with headingElement and viewAllParagraph, or null

---

### `filterAllBlogPostsOnPage()`
Filters all blog posts on the page and caches results.

**Returns:**
- `Promise<Array>` - Array of filtered blog post results

---

### `getFilteredResults(config)`
Gets filtered results matching a specific config.

**Parameters:**
- `config` (Object) - Configuration object

**Returns:**
- `Promise<Array>` - Array of matching blog posts

---

### `getReadMoreString()`
Translates the Read More string into the local language.

**Returns:**
- `Promise<string>` - Translated read more string

---

### `getCardParameters(post, dateFormatter)`
Given a post, get all the required parameters from it to construct a card or hero card.

**Parameters:**
- `post` (Object) - Blog post object
- `dateFormatter` (Intl.DateTimeFormat) - Date formatter instance

**Returns:**
- `Object` - Card parameters object

---

### `getHeroCard(post, dateFormatter, blogTag)`
For configs with a single featured post, get a hero sized card.

**Parameters:**
- `post` (Object) - Blog post object
- `dateFormatter` (Intl.DateTimeFormat) - Date formatter instance
- `blogTag` (string) - Tag to display on card

**Returns:**
- `Promise<HTMLElement>` - Hero card element

---

### `getCard(post, dateFormatter, blogTag)`
For configs with more than one post, get regular cards.

**Parameters:**
- `post` (Object) - Blog post object
- `dateFormatter` (Intl.DateTimeFormat) - Date formatter instance
- `blogTag` (string) - Tag to display on card

**Returns:**
- `HTMLElement` - Card element

---

### `getDateFormatter(newLanguage)`
Cached language and dateFormatter since creating a DateFormatter is an expensive operation.

**Parameters:**
- `newLanguage` (string) - Language code (IETF format)

---

### `addRightChevronToViewAll(blockElement)`
Adds right chevron SVG icon to view all link.

**Parameters:**
- `blockElement` (HTMLElement) - The blog posts block element

---

### `getBlogTag(block)`
Get blog tag from content-toggle-active section or use default.

**Parameters:**
- `block` (HTMLElement) - The blog posts block element

**Returns:**
- `string` - Blog tag value

---

### `updateBlogTags(block, tagValue)`
Update all blog tags in a block.

**Parameters:**
- `block` (HTMLElement) - The blog posts block element
- `tagValue` (string) - New tag value

---

### `observeContentToggleChanges(block)`
Set up observer to watch for content-toggle changes.

**Parameters:**
- `block` (HTMLElement) - The blog posts block element

---

### `decorateBlogPosts(blogPostsElements, config, offset = 0)`
Given a blog post element and a config, append all posts defined in the config to blogPosts.

**Parameters:**
- `blogPostsElements` (HTMLElement) - The blog posts container element
- `config` (Object) - Configuration object
- `offset` (number) - Starting offset for pagination (default: 0)

**Returns:**
- `Promise<boolean>` - True if posts were added, false otherwise

---

### `checkStructure(element, querySelectors)`
Checks if element matches any of the provided query selectors.

**Parameters:**
- `element` (HTMLElement) - Element to check
- `querySelectors` (Array) - Array of query selector strings

**Returns:**
- `boolean` - True if structure matches, false otherwise

---

### `decorate(block)`
Main decorator function for blog-posts-v2 blocks.

**Parameters:**
- `block` (HTMLElement) - The blog posts block element to decorate
