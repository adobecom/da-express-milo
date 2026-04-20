import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import ColorThemeExpressController from '../../../../express/code/scripts/color-shared/controllers/ColorThemeExpressController.js';

setLibs('/libs');

function getPaletteHexes(baseColor, swatchCount, harmonyRule) {
  const controller = new ColorThemeExpressController({
    swatches: Array(swatchCount).fill(baseColor),
    harmonyRule,
    baseColorIndex: 0,
  });
  controller.setBaseColor(baseColor);
  return controller.getState().swatches.map((s) => s.hex.toUpperCase());
}

const PALETTE_FIXTURES = [
  {
    label: '5-color palette, base #9E2BFC',
    base: '#9E2BFC',
    count: 5,
    cases: [
      ['ANALOGOUS', ['#9E2BFC', '#5A2BFC', '#E32BFC', '#2B40FC', '#FC2BAE']],
      ['COMPLEMENTARY', ['#EDFC2B', '#8B4FBD', '#9E2BFC', '#A1A754', '#6A547D']],
      ['SPLIT_COMPLEMENTARY', ['#9E2BFC', '#95FC2B', '#FCE82B', '#6A547D', '#697D54']],
      ['TRIAD', ['#2BFC7B', '#FCAD2B', '#9E2BFC', '#8254A7', '#547D63']],
      ['SQUARE', ['#2BFCF2', '#EDFC2B', '#9E2BFC', '#FC732B', '#8254A7']],
      ['COMPOUND', ['#2C2BFC', '#5AFC2B', '#9E2BFC', '#EDFC2B', '#8254A7']],
      ['SHADES', ['#8825D9', '#6E1EB0', '#9E2BFC', '#551787', '#3B105E']],
      ['MONOCHROMATIC', ['#9E2BFC', '#904BC9', '#795696', '#594D63', '#2F2A33']],
    ],
  },
  {
    label: '2-color palette, base #FF763B',
    base: '#FF763B',
    count: 2,
    cases: [
      ['COMPLEMENTARY', ['#3BFFE5', '#FF763B']],
      ['SHADES', ['#B35229', '#FF763B']],
      ['MONOCHROMATIC', ['#80675D', '#FF763B']],
    ],
  },
  {
    label: '3-color palette, base #115E50',
    base: '#115E50',
    count: 3,
    cases: [
      ['ANALOGOUS', ['#115E50', '#115E36', '#11535E']],
      ['COMPLEMENTARY', ['#115E50', '#5E2611', '#5CB3A3']],
      ['SPLIT_COMPLEMENTARY', ['#115E50', '#5E3411', '#5E1911']],
      ['TRIAD', ['#115E50', '#5E4D11', '#5C115E']],
      ['SHADES', ['#115E50', '#28DEBC', '#1C9A83']],
      ['MONOCHROMATIC', ['#115E50', '#5CB3A3', '#D8FFF8']],
    ],
  },
  {
    label: '4-color palette, base #FFCFCF',
    base: '#FFCFCF',
    count: 4,
    cases: [
      ['ANALOGOUS', ['#FFCFCF', '#803E3E', '#FFD7CF', '#FFCFEC']],
      ['COMPLEMENTARY', ['#FFCFCF', '#3E8051', '#AA7070', '#CFFFDC']],
      ['SPLIT_COMPLEMENTARY', ['#FFCFCF', '#803E3E', '#D2FFCF', '#CFFFED']],
      ['TRIAD', ['#FFCFCF', '#AA7070', '#FFFECF', '#CFECFF']],
      ['SQUARE', ['#FFCFCF', '#FFF5CF', '#CFFFDC', '#CFD3FF']],
      ['COMPOUND', ['#FFCFCF', '#CFFFDC', '#CFFFF8', '#FFCFFF']],
      ['SHADES', ['#7F6767', '#B39191', '#FFCFCF', '#E5BABA']],
      ['MONOCHROMATIC', ['#400F0F', '#803E3E', '#FFCFCF', '#BF8E8E']],
    ],
  },
  {
    label: '6-color palette, base #FF1000',
    base: '#FF1000',
    count: 6,
    cases: [
      ['ANALOGOUS', ['#FF00F8', '#FF3E00', '#FF1100', '#FF005F', '#FF6055', '#FF6A00']],
      ['COMPLEMENTARY', ['#39AA67', '#BF3930', '#FF1100', '#00FF69', '#395544', '#804440']],
      ['SPLIT_COMPLEMENTARY', ['#804440', '#00FF13', '#FF1100', '#00FFC0', '#408044', '#408070']],
      ['TRIAD', ['#AA4039', '#E2FF00', '#FF1100', '#007EFF', '#788040', '#405F80']],
      ['SQUARE', ['#FFD400', '#00FF69', '#FF1100', '#0900FF', '#424080', '#AA4039']],
      ['COMPOUND', ['#00FF69', '#00FFFA', '#FF1100', '#FF00C5', '#804071', '#AA4039']],
      ['SHADES', ['#B30C00', '#D40E00', '#FF1100', '#F61000', '#6F0700', '#910A00']],
      ['MONOCHROMATIC', ['#804440', '#AA4039', '#FF1100', '#D52F23', '#332B2B', '#553B39']],
    ],
  },
  {
    label: '7-color palette, base #FFF799',
    base: '#FFF799',
    count: 7,
    cases: [
      ['ANALOGOUS', ['#FFDE99', '#F2FF99', '#FFF799', '#FFEA99', '#FFFCDD', '#C7FF99', '#807859']],
      ['COMPLEMENTARY', ['#AAA3BF', '#CCC9A3', '#FFF799', '#B499FF', '#635980', '#99967A', '#66633D']],
      ['SPLIT_COMPLEMENTARY', ['#AAA893', '#999FFF', '#FFF799', '#D599FF', '#9395AA', '#A193AA', '#55522D']],
      ['TRIAD', ['#BFBDA3', '#99EAFF', '#FFF799', '#FF99BC', '#93A5AA', '#AA939B', '#807C59']],
      ['SQUARE', ['#99FFDC', '#B499FF', '#FFF799', '#FFAC99', '#806159', '#AAA893', '#635980']],
      ['COMPOUND', ['#B499FF', '#EC99FF', '#FFF799', '#FFE299', '#807559', '#AAA893', '#785980']],
      ['SHADES', ['#B3AD6B', '#D0C97D', '#FFF799', '#EDE58E', '#787448', '#95905A', '#5B5837']],
      ['MONOCHROMATIC', ['#928F70', '#B6B4A1', '#FFF799', '#DBD6A2', '#494623', '#6D6A45', '#333011']],
    ],
  },
];

describe('ColorThemeExpressController harmony rules', () => {
  PALETTE_FIXTURES.forEach(({ label, base, count, cases }) => {
    describe(label, () => {
      cases.forEach(([rule, expected]) => {
        it(`creates ${rule} harmony palette`, () => {
          expect(getPaletteHexes(base, count, rule)).to.have.members(expected);
        });
      });
    });
  });
});
