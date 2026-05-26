Rule:
No CSS variable fallbacks

Wrong:
```
.my-class {
  background: var(--color-white, #FFFFFF);
}
```

Right:
```
// block.css
.my-class {
  background: var(--color-white);
}

// styles.css
:root {
  --color-white: #FFFFFF;
}
```

Why:
For best organization, all CSS variables should be defined either globally in styles.css or in the particular file if it only applies locally. When all variables are defined, fallbacks are unnecessary.
