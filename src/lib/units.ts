export const METERS_PER_FOOT = 0.3048;
export const MAX_ROOM_METERS = 30.48;

export function feetInchesToMeters(feet: number, inches: number): number {
  return feet * METERS_PER_FOOT + inches * 0.0254;
}

export function metersToFeetInches(meters: number) {
  const totalInches = Math.round(meters / 0.0254);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function formatFeetInches(meters: number): string {
  const { feet, inches } = metersToFeetInches(meters);
  return `${feet}′ ${inches}″`;
}

export const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(price);
