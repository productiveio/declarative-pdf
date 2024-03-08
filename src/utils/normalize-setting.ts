import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from './paper-defaults';

type TemplateSetting = {
  index: number;
  width?: number;
  height?: number;
};

const capNumber = (num: unknown, min: number, max: number, base: number) => {
  if (typeof num !== 'number' || isNaN(num)) return base;
  return Math.min(Math.max(num, min), max);
};

export function normalizeSetting(setting: TemplateSetting) {
  let width = setting.width;

  if (typeof width !== 'number' || isNaN(width)) width = DEFAULT_WIDTH;
  if (width <= 0) width = DEFAULT_WIDTH;
  if (width < 1) width = 1;
  if (width > 420_000) width = 420_000;

  return {
    index: setting.index,
    width: capNumber(setting.width, 1, 420_000, DEFAULT_WIDTH),
    height: capNumber(setting.height, 1, 420_000, DEFAULT_HEIGHT),
  };
}
