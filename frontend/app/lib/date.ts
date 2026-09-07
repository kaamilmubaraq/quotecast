import { format, isValid } from "date-fns";
import { ja } from "date-fns/locale";

const DEFAULT_FORMAT = "yyyy/MM/dd(E) HH:mm:ss";

export const dateFormat = (
  date: string | Date | undefined,
  convertFormat: string = DEFAULT_FORMAT,
  fallback: string = "-",
): string => {
  if (!date) {
    return fallback;
  }

  const dateObject = new Date(date);

  if (!isValid(dateObject)) {
    return fallback;
  }

  return format(dateObject, convertFormat, { locale: ja });
};

export const TIME_UNITS = {
  SECONDS: 1000,
  MINUTES: 1000 * 60,
  HOUR: 1000 * 60 * 60,
  DAY: 1000 * 60 * 60 * 24,
};
