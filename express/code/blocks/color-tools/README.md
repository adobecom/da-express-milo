# Color Tools Block

The `color-tools` block allows authors to embed interactive Adobe Color components (Palette visualization, Color Wheel) directly into Express pages.

## Usage

| Variant | Class Name | Description |
| :--- | :--- | :--- |
| **Palette** | `palette` | Renders a read-only display of a color palette. (Default) |
| **Wheel** | `wheel` | Renders an interactive color wheel for generating harmonies. |

### Authoring Examples

**1. Default Palette Display**
```
Color Tools (Palette)
```

**2. Interactive Color Wheel**
```
Color Tools (Wheel)
```

## Configuration (Future Possibilities)

Currently, the block takes no content. However, future enhancements could allow authors to configure the initial state via the block table:

-   **Initial Colors**: Provide a list of hex codes to pre-seed the palette.
-   **Harmony Rule**: Set the initial rule (e.g., "Triad", "Complementary") for the wheel.
-   **Interaction Mode**: Toggle between "Read Only" and "Interactive".

**Example Future Authoring:**

| Color Tools (Wheel) |
| :--- |
| **Initial Hex** | #FF0000 |
| **Rule** | Triad |

