import de from './de.json'

type TranslationValue = string | TranslationTree
type TranslationTree = {
  [key: string]: TranslationValue
}

const translations = de as TranslationTree

export function t(
  path: string,
  replacements: Record<string, string | number> = {},
): string {
  const value = path
    .split('.')
    .reduce<TranslationValue | undefined>(
      (currentValue, key) =>
        typeof currentValue === 'object' ? currentValue[key] : undefined,
      translations,
    )

  if (typeof value !== 'string') {
    return path
  }

  return Object.entries(replacements).reduce(
    (text, [key, replacement]) =>
      text.replaceAll(`{{${key}}}`, String(replacement)),
    value,
  )
}

