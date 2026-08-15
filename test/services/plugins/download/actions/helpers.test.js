/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import {
  buildLinearGradientSVG,
  buildVariableSwatches,
  escapeXmlAttr,
  formatSwatchInMode,
  getClassName,
  getLinearGradientCSS,
} from '../../../../../../express/code/libs/services/plugins/download/actions/helpers.js';

// R217 G159 B89 — the same swatch used throughout the Color mode picker's own
// manual QA this session, so expected values here can be cross-checked
// against what the swatch rail itself displays for the same color.
const swatch = { rgb: { r: 217 / 255, g: 159 / 255, b: 89 / 255 } };

describe('formatSwatchInMode', () => {
  it('HEX: uppercase hex string, functional color', () => {
    expect(formatSwatchInMode(swatch, 'HEX')).to.deep.equal({
      suffix: 'hex', value: '#D99F59', isFunctionalColor: true,
    });
  });

  it('RGB: rgba() with alpha 1, functional color, suffix matches the function used', () => {
    expect(formatSwatchInMode(swatch, 'RGB')).to.deep.equal({
      suffix: 'rgba', value: 'rgba(217, 159, 89, 1)', isFunctionalColor: true,
    });
  });

  it('HSB: uses hsl() (no valid CSS hsb()/hsv() function), functional color, suffix matches the function used', () => {
    const result = formatSwatchInMode(swatch, 'HSB');
    expect(result.suffix).to.equal('hsl');
    expect(result.value).to.equal('hsl(33, 63%, 60%)');
    expect(result.isFunctionalColor).to.equal(true);
  });

  it('Lab: real Lab conversion using the CSS4 lab() function, functional color', () => {
    const result = formatSwatchInMode(swatch, 'Lab');
    expect(result.suffix).to.equal('lab');
    expect(result.value).to.equal('lab(70% 14 44)');
    expect(result.isFunctionalColor).to.equal(true);
  });

  it('defaults to RGB for an unrecognized mode', () => {
    expect(formatSwatchInMode(swatch, 'nonsense')).to.deep.equal({
      suffix: 'rgba', value: 'rgba(217, 159, 89, 1)', isFunctionalColor: true,
    });
  });
});

describe('getClassName', () => {
  it('replaces spaces with a single hyphen, preserving case', () => {
    expect(getClassName('Jolly Rancher')).to.equal('Jolly-Rancher');
  });

  it('regression: strips apostrophes and other CSS-unsafe characters instead of leaving them in the class name', () => {
    expect(getClassName("Tom's Palette")).to.equal('Tom-s-Palette');
    expect(getClassName('a<b&c')).to.equal('a-b-c');
  });

  it('falls back to a default for empty/nullish names', () => {
    expect(getClassName('')).to.equal('colortheme-color');
    expect(getClassName(undefined)).to.equal('colortheme-color');
  });
});

describe('escapeXmlAttr', () => {
  it('escapes &, \', and < so the result is safe inside a single-quoted XML attribute', () => {
    expect(escapeXmlAttr(`Tom's & <Palette>`)).to.equal('Tom&apos;s &amp; &lt;Palette>');
  });
});

describe('buildVariableSwatches', () => {
  const swatches = [swatch, { rgb: { r: 1, g: 1, b: 1 } }];

  it('emits only the requested mode — not every mode at once, with no header comment', () => {
    const output = buildVariableSwatches(swatches, 'My Theme', '$', 'HSB');
    expect(output).not.to.include('/*');
    expect(output).to.include('$My-Theme-1-hsl: hsl(33, 63%, 60%);');
    expect(output).to.include('$My-Theme-2-hsl: hsl(0, 0%, 100%);');
    // Regression guard: this used to always dump hex + rgba + hsla together.
    expect(output).not.to.include('-hex:');
    expect(output).not.to.include('-rgba:');
  });

  it('uses the given variable prefix (@ for LESS, $ for SCSS)', () => {
    const less = buildVariableSwatches(swatches, 'My Theme', '@', 'HEX');
    expect(less).to.include('@My-Theme-1-hex: #D99F59;');
  });

  it('defaults to RGB when no mode is given', () => {
    const output = buildVariableSwatches(swatches, 'My Theme', '$');
    expect(output).to.include('-rgba:');
  });
});

describe('getLinearGradientCSS', () => {
  const stops = [
    { rgb: swatch.rgb, offset: 0, midpoint: 0.5 },
    { rgb: { r: 1, g: 1, b: 1 }, offset: 1, midpoint: 0.5 },
  ];

  it('builds a Lab-based gradient stop list using the real lab() function', () => {
    const { linearGradientDataLAB } = getLinearGradientCSS(stops);
    expect(linearGradientDataLAB).to.include('lab(70% 14 44) 0%');
    expect(linearGradientDataLAB).to.include('lab(100% 0 0) 100%');
  });

  it('builds an HSL-based gradient stop list for HSB mode (no valid CSS hsb()/hsv() function, so hsl() is the nearest real substitute — same as colorweb\'s own "Copy as CSS")', () => {
    const { linearGradientDataHSL } = getLinearGradientCSS(stops);
    expect(linearGradientDataHSL).to.include('hsl(33, 63%, 60%) 0%');
    expect(linearGradientDataHSL).to.include('hsl(0, 0%, 100%) 100%');
  });
});

describe('buildLinearGradientSVG', () => {
  const stops = [
    { rgb: swatch.rgb, offset: 0, midpoint: 0.5 },
    { rgb: { r: 1, g: 1, b: 1 }, offset: 1, midpoint: 0.5 },
  ];

  it('produces well-formed XML that a strict parser accepts', () => {
    // Regression test: the two xmlns attributes used to be concatenated with
    // no space between them ('...svg"' + 'xmlns:xlink="...'), which is
    // invalid XML — the file opened with a parse error outside the browser
    // (e.g. in a real SVG/XML viewer), even though Chrome's <img>/background
    // rendering is lenient enough to display it anyway.
    const svg = buildLinearGradientSVG(stops, { width: 640, height: 640 });
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror'), `XML parse error in:\n${svg}`).to.equal(null);
  });

  it('declares both required namespaces, separated by whitespace', () => {
    const svg = buildLinearGradientSVG(stops, { width: 640, height: 640 });
    expect(svg).to.include('xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it('declares a viewBox matching the intrinsic size, preserveAspectRatio="none", and a percentage-sized rect — not a hardcoded pixel size', () => {
    // Regression test: without a viewBox, and with the <rect> hardcoded to the
    // same absolute pixel size as width/height, the gradient didn't scale when
    // only the outer width/height was changed afterward (by hand, or by a
    // design tool resizing the artboard) — the rect stayed pinned at its
    // original size in the top-left corner instead of stretching to fill.
    const svg = buildLinearGradientSVG(stops, { width: 640, height: 320 });
    expect(svg).to.include('viewBox="0 0 640 320"');
    expect(svg).to.include('preserveAspectRatio="none"');
    expect(svg).to.include('<rect width="100%" height="100%"');
  });

  it('stretches to fill when only the width attribute is changed after the fact, even to a non-square ratio', () => {
    // Resizing to a non-square ratio (1280x640 from a 640x640 source) is the
    // part that also needs preserveAspectRatio="none": a viewBox alone isn't
    // enough — the default "xMidYMid meet" still letterboxes/centers the
    // original square content instead of stretching it to fill the new box.
    const svg = buildLinearGradientSVG(stops, { width: 640, height: 640 });
    const resized = svg.replace('width="640" height="640"', 'width="1280" height="640"');
    const parsed = new DOMParser().parseFromString(resized, 'image/svg+xml');
    const svgEl = document.adoptNode(parsed.documentElement);
    // getBoundingClientRect() reports the actual rendered (post-CTM) pixel
    // box, unlike getBBox() (which stays in pre-transform user-space units
    // and would report 640 either way). This is what confirms the rect
    // visually grew to fill the resized 1280px-wide viewport instead of
    // staying pinned at (or letterboxed to) its original 640px width.
    document.body.appendChild(svgEl);
    try {
      expect(svgEl.querySelector('rect').getBoundingClientRect().width).to.equal(1280);
    } finally {
      svgEl.remove();
    }
  });
});
