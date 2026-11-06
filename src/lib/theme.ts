import { FONT_OPTIONS, type DesignSettings } from '@/types';

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
const FONT_LINK_ID = 'theme-font-link';

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return [
    Math.round(color[0] + (target[0] - color[0]) * amount),
    Math.round(color[1] + (target[1] - color[1]) * amount),
    Math.round(color[2] + (target[2] - color[2]) * amount),
  ];
}

function toTriplet([r, g, b]: Rgb): string {
  return `${r} ${g} ${b}`;
}

function buildBrandRamp(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  const shades: Record<string, Rgb> = {
    50: mix(base, WHITE, 0.92),
    100: mix(base, WHITE, 0.82),
    200: mix(base, WHITE, 0.66),
    300: mix(base, WHITE, 0.42),
    400: mix(base, WHITE, 0.2),
    500: mix(base, WHITE, 0.08),
    600: base,
    700: mix(base, BLACK, 0.18),
    800: mix(base, BLACK, 0.35),
    900: mix(base, BLACK, 0.5),
  };
  return Object.fromEntries(Object.entries(shades).map(([shade, rgb]) => [`--brand-${shade}`, toTriplet(rgb)]));
}

function loadFont(fontFamily: DesignSettings['font_family']): void {
  const option = FONT_OPTIONS.find((font) => font.value === fontFamily) ?? FONT_OPTIONS[0];
  const href = `https://fonts.googleapis.com/css2?family=${option.value.replace(/ /g, '+')}:wght@${option.weights}&display=swap`;
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

export function applyTheme(settings: DesignSettings): void {
  const root = document.documentElement.style;
  const fontStack = `"${settings.font_family}", Cairo, Tajawal, system-ui, sans-serif`;

  Object.entries(buildBrandRamp(settings.primary_color)).forEach(([name, value]) => root.setProperty(name, value));
  root.setProperty('--color-active', toTriplet(hexToRgb(settings.active_color)));
  root.setProperty('--color-button', toTriplet(hexToRgb(settings.button_color)));
  root.setProperty('--color-badge', toTriplet(hexToRgb(settings.badge_color)));
  root.setProperty('--font-body', fontStack);
  root.setProperty('--weight-body', String(settings.body_weight));
  root.setProperty('--weight-bold', String(settings.bold_weight));
  root.setProperty('--scale-heading', String(settings.heading_scale));
  root.setProperty('--scale-body', String(settings.body_scale));
  root.setProperty('--scale-button', String(settings.button_scale));

  loadFont(settings.font_family);
}
