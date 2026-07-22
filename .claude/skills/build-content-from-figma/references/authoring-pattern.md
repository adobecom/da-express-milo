# Authoring Pattern Reference

HTML structure for authoring DA (Document Authoring) block content
for Express EDS blocks. The block is authored as a `<table>` so media
can stack in the right column while the text column spans via `rowspan`.

Express blocks handle responsive layout through CSS — there are no
`mobile-viewport`/`desktop-viewport` keyword rows in the authored HTML.

---

## Document skeleton

```html
<body>
  <header></header>
  <main>
    <div>
      <table>
        <tbody>
          <tr><td colspan="2"><p>block-name (variant-a, variant-b)</p></td></tr>
          <!-- content rows -->
        </tbody>
      </table>
    </div>
  </main>
  <footer></footer>
</body>
```

No metadata block needed. No `section-metadata` unless the user
explicitly requests container/layout styling.

---

## Block structure

A block is a `<table>` whose first row is the block header (block
name + variants), and subsequent rows hold content.

```html
<table>
  <tbody>
    <tr><td colspan="2"><p>block-name (variant-a, variant-b)</p></td></tr>
    <!-- content rows -->
  </tbody>
</table>
```

- Header: a single `<td colspan="2">` with `<p>block-name (variant-a, variant-b)</p>`.
  Variants in parentheses, comma-separated. No variants: `<p>block-name</p>`.

---

## Content rows — text column + stacked media column

The main content row has two columns:
- **Left:** text content (icon, eyebrow, heading, body, links).
- **Right:** media elements (background, foreground).

Additional media stacks vertically in the right column. The left `<td>`
uses `rowspan="N"` where N is the number of media sub-rows.

```html
<tr>
  <td rowspan="2">
    <!-- text content -->
  </td>
  <td>
    <!-- first media (background) -->
  </td>
</tr>
<tr>
  <td>
    <!-- second media (foreground) -->
  </td>
</tr>
```

Omit `rowspan` when there is only one media element.

### Left column: text content

Elements appear in this order (all optional):

```html
<td rowspan="N">
  <p><a href="https://main--repo--org.aem.page/path/icon.svg">https://main--repo--org.aem.page/path/icon.svg</a></p>
  <p>Eyebrow text</p>
  <h3>Heading text</h3>
  <p>Body text paragraph.</p>
  <p><strong><a href="https://www.adobe.com/">Primary CTA</a></strong> <em><a href="https://www.adobe.com/">Secondary CTA</a></em></p>
</td>
```

| Element | Tag | Notes |
|---------|-----|-------|
| Icon (SVG) | `<p><a href="url">url</a></p>` | Both href and display text are the `aem.page` preview URL. Upload SVG at the same level as the document (not the shadow folder), then preview via EDS admin API. |
| Eyebrow | `<p>` | Optional detail text above the heading. |
| Heading | `<hN>` | N from visual heuristic (see `token-mapping.md`). |
| Body | `<p>` | One or more paragraphs. |
| Links | `<a>` with wrappers | `<strong><a>` = primary CTA, `<em><a>` = secondary CTA, bare `<a>` = plain link. URLs are `https://www.adobe.com/` placeholders. |

### Right column: media

**Color background** — plain text, no wrapper:
```html
<td>#1a1a1a</td>
<td>linear-gradient(135deg, #1a1a1a, #2d2d2d)</td>
```

**Image media:**
```html
<td>
  <picture>
    <img src="https://content.da.live/org/repo/drafts/ldap/.my-page/bg.png" alt="description">
  </picture>
</td>
```

Order: background first, foreground second, additional media after.

---

## Complete example

```html
<body>
  <header></header>
  <main>
    <div>
      <table>
        <tbody>
          <tr><td colspan="2"><p>ax-marquee</p></td></tr>
          <tr>
            <td rowspan="2">
              <p><a href="https://main--da-express-milo--adobecom.aem.page/drafts/methomas/sparkle.svg">https://main--da-express-milo--adobecom.aem.page/drafts/methomas/sparkle.svg</a></p>
              <p>New feature</p>
              <h2>Create anything with Adobe Express</h2>
              <p>Make stunning social posts, images, videos, flyers, and more.</p>
              <p><strong><a href="https://www.adobe.com/">Start free trial</a></strong> <em><a href="https://www.adobe.com/">Learn more</a></em></p>
            </td>
            <td>#1a1a1a</td>
          </tr>
          <tr>
            <td>
              <picture>
                <img src="https://content.da.live/adobecom/da-express-milo/drafts/methomas/.my-page/hero.png" alt="Hero illustration">
              </picture>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
  <footer></footer>
</body>
```
