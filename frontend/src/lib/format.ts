export function formatNumber(value: number, locale = "es-ES"): string {
  return new Intl.NumberFormat(locale).format(value)
}
