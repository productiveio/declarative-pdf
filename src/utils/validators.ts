function throwTemplateParsingError(message: string) {
  throw new Error(`Template parsing error: ${message}`);
}

type TemplateSetting = {
  index?: number;
  width?: number;
  height?: number;
};

export function validateTemplateSetting(setting?: TemplateSetting) {
  if (
    !(
      setting &&
      typeof setting === 'object' &&
      'index' in setting &&
      'width' in setting &&
      'height' in setting
    )
  )
    return throwTemplateParsingError('setting is malformed');

  if (typeof setting.index !== 'number' || isNaN(setting.index))
    return throwTemplateParsingError('setting.index is not a number');
  if (setting.index < 0)
    return throwTemplateParsingError('setting.index is negative');
  if (setting.index > 10)
    return throwTemplateParsingError('setting.index is too large');

  if (typeof setting.width !== 'number' || isNaN(setting.width))
    return throwTemplateParsingError('setting.width is not a number');
  if (setting.width <= 0)
    return throwTemplateParsingError('setting.width is not positive');
  if (setting.width < 42)
    return throwTemplateParsingError('setting.width is too small');
  if (setting.width > 42_000)
    return throwTemplateParsingError('setting.width is too large');

  if (typeof setting.height !== 'number' || isNaN(setting.height))
    return throwTemplateParsingError('setting.height is not a number');
  if (setting.height <= 0)
    return throwTemplateParsingError('setting.height is not positive');
  if (setting.height < 42)
    return throwTemplateParsingError('setting.height is too small');
  if (setting.height > 42_000)
    return throwTemplateParsingError('setting.height is too large');
}
