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
      ['ANALOGOUS', ['#FF00F8', '#FF3E00', '#FF1000', '#FF005F', '#FF6055', '#FF6A00']],
      ['COMPLEMENTARY', ['#39AA67', '#BF3930', '#FF1000', '#00FF69', '#395544', '#804440']],
      ['SPLIT_COMPLEMENTARY', ['#804440', '#00FF13', '#FF1000', '#00FFC0', '#408044', '#408070']],
      ['TRIAD', ['#AA4039', '#E2FF00', '#FF1000', '#007EFF', '#788040', '#405F80']],
      ['SQUARE', ['#FFD400', '#00FF69', '#FF1000', '#0900FF', '#424080', '#AA4039']],
      ['COMPOUND', ['#00FF69', '#00FFFA', '#FF1000', '#FF00C5', '#804071', '#AA4039']],
      ['SHADES', ['#B30C00', '#D40E00', '#FF1000', '#F61000', '#6F0700', '#910A00']],
      ['MONOCHROMATIC', ['#804440', '#AA4039', '#FF1000', '#D52F23', '#332B2B', '#553B39']],
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
  {
    label: '8-color palette, base #1F3DA6',
    base: '#1F3DA6',
    count: 8,
    cases: [
      ['ANALOGOUS', ['#1F3DA6', '#1F67A6', '#2D1FA6', '#1F91A6', '#591FA6', '#5768A6', '#232C33', '#252333']],
      ['COMPLEMENTARY', ['#1F3DA6', '#A6821F', '#2D3C73', '#66572D', '#262B40', '#332F23', '#282B33', '#33312C']],
      ['SPLIT_COMPLEMENTARY', ['#1F3DA6', '#A6921F', '#A6721F', '#2A3351', '#514B2A', '#51422A', '#2C2D33', '#33322C']],
      ['TRIAD', ['#1F3DA6', '#65A61F', '#A63D1F', '#2D3966', '#3E512A', '#51332A', '#232733', '#2F332C']],
      ['SQUARE', ['#1F3DA6', '#1FA633', '#A6821F', '#A61F40', '#2A3351', '#233325', '#332F23', '#332327']],
      ['COMPOUND', ['#1F3DA6', '#1F83A6', '#A69D1F', '#A6821F', '#2A3351', '#232F33', '#333223', '#332F23']],
      ['SHADES', ['#1F3DA6', '#1F3DA6', '#1B338C', '#162A73', '#112159', '#0C1740', '#2E59F2', '#294FD9']],
      ['MONOCHROMATIC', ['#1F3DA6', '#2A3E86', '#2D3966', '#282E46', '#232733', '#2A2C33', '#2C2D33', '#252833']],
    ],
  },
  {
    label: '9-color palette, base #33001E',
    base: '#33001E',
    count: 9,
    cases: [
      ['ANALOGOUS', ['#33001E', '#2E0033', '#330000', '#1D0033', '#330900', '#331125', '#AA59B3', '#B35A59', '#8C59B3']],
      ['COMPLEMENTARY', ['#33001E', '#033300', '#5E103D', '#196614', '#882D62', '#43993D', '#B3598D', '#7FCC7A', '#DD93BE']],
      ['SPLIT_COMPLEMENTARY', ['#33001E', '#00330F', '#183300', '#882D62', '#2D8848', '#59882D', '#DD93BE', '#93DDA9', '#B6DD93']],
      ['TRIAD', ['#33001E', '#002F33', '#332C00', '#731D4F', '#2D8188', '#887C2D', '#B3598D', '#93D7DD', '#DDD393']],
      ['SQUARE', ['#33001E', '#001433', '#033300', '#332200', '#731D4F', '#2D5188', '#33882D', '#886A2D', '#B3598D']],
      ['COMPOUND', ['#33001E', '#230033', '#00331A', '#033300', '#731D4F', '#6B2D88', '#2D885C', '#33882D', '#B3598D']],
      ['SHADES', ['#33001E', '#F60090', '#E00083', '#C90075', '#B30068', '#9C005B', '#85004E', '#6E0040', '#580033']],
      ['MONOCHROMATIC', ['#33001E', '#4F0932', '#6C1849', '#882D62', '#A4497E', '#C16B9D', '#DD93BE', '#F9C2E2', '#FFE3F3']],
    ],
  },
  {
    label: '10-color palette, base #F0FFE0',
    base: '#F0FFE0',
    count: 10,
    cases: [
      ['ANALOGOUS', ['#F0FFE0', '#FDFFE0', '#E3FFE0', '#FFFCE0', '#E0FFE8', '#CCFF96', '#7B8036', '#3D8036', '#807836', '#368049']],
      ['COMPLEMENTARY', ['#F0FFE0', '#FBE0FF', '#BBD5A0', '#C593CC', '#88AA64', '#8F5099', '#5C8036', '#5D2166', '#365516', '#2D0633']],
      ['SPLIT_COMPLEMENTARY', ['#F0FFE0', '#FFE0F4', '#F1E0FF', '#A1BF80', '#BF80A9', '#A280BF', '#5C8036', '#803665', '#5E3680', '#26400B']],
      ['TRIAD', ['#F0FFE0', '#FFE7E0', '#E0E7FF', '#B0CC93', '#BF8E80', '#808EBF', '#769950', '#804636', '#364580', '#446621']],
      ['SQUARE', ['#F0FFE0', '#FFF0E0', '#FBE0FF', '#E0F7FF', '#A1BF80', '#AA8864', '#A164AA', '#6498AA', '#5C8036', '#553616']],
      ['COMPOUND', ['#F0FFE0', '#FFFDE0', '#FFE0E8', '#FBE0FF', '#A1BF80', '#AAA664', '#AA6475', '#A164AA', '#5C8036', '#555116']],
      ['SHADES', ['#F0FFE0', '#F0FFE0', '#E2F0D3', '#CFDBC1', '#BBC7AF', '#A8B39D', '#959E8B', '#828A79', '#6E7567', '#5B6155']],
      ['MONOCHROMATIC', ['#F0FFE0', '#D2E6BC', '#B0CC93', '#92B36F', '#769950', '#5C8036', '#446621', '#304D11', '#1D3306', '#1B3301']],
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
