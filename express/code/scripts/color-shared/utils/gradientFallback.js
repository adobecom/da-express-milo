export const FIGMA_GRADIENT_EXTRACT = 'linear-gradient(90deg, #bfcdd9 0%, #3f8ebf 25%, #49590b 50%, #8da634 75%, #818c2b 100%)';

export function getFigmaExtractGradient() {
  return {
    id: 'figma-extract',
    name: 'Gradient (Extract fallback)',
    gradient: FIGMA_GRADIENT_EXTRACT,
  };
}

/**
 * Fallback gradients when API fails. Card format: { id, name, gradient }.
 * Do not mutate the returned array.
 */
const FALLBACK_GRADIENTS_LIST = Object.freeze([
  { id: 'g1', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g2', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g3', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g4', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g5', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g6', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g7', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g8', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g9', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g10', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g11', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g12', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g13', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g14', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g15', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g16', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g17', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g18', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g19', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g20', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g21', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g22', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g23', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g24', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g25', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g26', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g27', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g28', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g29', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g30', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #A6A094 0%, #BFBAB4 25%, #F2EFE8 50%, #3F3529 75%, #8B7E6D 100%)' },
  { id: 'g31', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
  { id: 'g32', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 25%, #000326 50%, #182573 75%, #1D64F2 100%)' },
  { id: 'g33', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #7B9EA6 0%, #D0ECF2 25%, #59391D 50%, #D99066 75%, #F34822 100%)' },
  { id: 'g34', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, #F31628 0%, #2173A5 25%, #F1BB13 50%, #F3A310 75%, #A60402 100%)' },
]);

export function fallbackGradients() {
  return [...FALLBACK_GRADIENTS_LIST];
}
