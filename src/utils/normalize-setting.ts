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
  return {
    index: setting.index,
    width: capNumber(setting.width, 1, 420_000, DEFAULT_WIDTH),
    height: capNumber(setting.height, 1, 420_000, DEFAULT_HEIGHT),
  };
}
