# Gen AI Cards Block - Function Documentation

## Functions

### `addBetaTag(card, title, betaPlaceholder)`
Adds a beta tag to a card title.

**Parameters:**
- `card` (HTMLElement) - The card element
- `title` (HTMLElement) - The title element to append tag to
- `betaPlaceholder` (string) - Beta tag text

---

### `decorateTextWithTag(textSource, options = {})`
Decorates text with an optional tag extracted from square brackets.

**Parameters:**
- `textSource` (string) - Text that may contain [tag] format
- `options` (Object) - Options for tag/base element types and classes

**Returns:**
- `HTMLElement` - Decorated text element

---

### `decorateHeading(block, payload)`
Creates and decorates the heading section with title, subheadings, and legal link.

**Parameters:**
- `block` (HTMLElement) - The gen-ai-cards block element
- `payload` (Object) - Payload containing heading, subHeadings, and legalLink

---

### `handleGenAISubmit(form, link)`
Handles form submission by replacing prompt token with user input and redirecting.

**Parameters:**
- `form` (HTMLElement) - The form element
- `link` (string) - URL template with prompt token

---

### `buildGenAIForm({ title, ctaLinks, subtext })`
Builds a Gen AI input form with text input and submit button.

**Parameters:**
- `title` (string) - Form title/aria-label
- `ctaLinks` (Array) - Array of CTA link elements
- `subtext` (string) - Placeholder text

**Returns:**
- `HTMLElement` - Form element

---

### `removeLazyAfterNeighborLoaded(image, lastImage)`
Removes lazy loading attribute from image after neighbor image loads.

**Parameters:**
- `image` (HTMLElement) - Image element to update
- `lastImage` (HTMLElement) - Neighbor image to wait for

---

### `decorateCards(block, { actions })`
Decorates cards with media, text, links, and optional Gen AI forms.

**Parameters:**
- `block` (HTMLElement) - The gen-ai-cards block element
- `actions` (Array) - Array of action objects with image, title, text, ctaLinks, etc.

---

### `constructPayload(block)`
Constructs payload object from block structure with heading and actions.

**Parameters:**
- `block` (HTMLElement) - The gen-ai-cards block element

**Returns:**
- `Object` - Payload with heading, subHeadings, legalLink, and actions

---

### `decorate(block)`
Main decorator function for gen-ai-cards blocks. Handles homepage and regular variants with carousel or compact nav carousel.

**Parameters:**
- `block` (HTMLElement) - The gen-ai-cards block element to decorate
