import {DEFAULT_HEIGHT, DEFAULT_WIDTH, DEFAULT_BODY_MARGIN_TOP, DEFAULT_BODY_MARGIN_BOTTOM} from './paper-defaults';

type TemplateSetting = {
  index: number;
  width?: number;
  height?: number;
  bodyMarginTop?: number;
  bodyMarginBottom?: number;
  hasSections?: boolean;
};

const capNumber = (num: unknown, min: number, max: number, base: number) => {
  if (typeof num !== 'number' || isNaN(num)) return base;
  return Math.min(Math.max(num, min), max);
};

export function normalizeSetting(setting: TemplateSetting) {
  return {
    index: setting.index,
    width: capNumber(setting.width, 1, 420_000, DEFAULT_WIDTH),
    height: capNumber(setting.height, 1, 420_000, DEFAULT_HEIGHT),
    bodyMarginTop: capNumber(setting.bodyMarginTop, 0, 420_000, DEFAULT_BODY_MARGIN_TOP),
    bodyMarginBottom: capNumber(setting.bodyMarginBottom, 0, 420_000, DEFAULT_BODY_MARGIN_BOTTOM),
    hasSections: setting.hasSections || false,
  };
}
