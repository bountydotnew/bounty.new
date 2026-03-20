/**
 * Homoglyph normalization for profanity detection
 *
 * Covers:
 * - Cyrillic/Greek lookalikes
 * - Fullwidth Latin (ａ-ｚ → a-z, U+FF41-FF5A)
 * - Mathematical variants (𝔞𝖆𝓪𝕒 etc)
 * - Zero-width character stripping
 */

// Base homoglyphs map: visually similar characters to ASCII
const homoglyphs: Record<string, string[]> = {
  a: [
    '\u0430', // Cyrillic а
    '\u00e0', // à
    '\u00e1', // á
    '\u1ea1', // ạ
    '\u0105', // ą
    '\u03b1', // Greek α
    '\u0251', // ɑ
    '\u00e2', // â
    '\u00e3', // ã
    '\u00e4', // ä
    '\u00e5', // å
    '\u0101', // ā
    '\u0103', // ă
    '\u01ce', // ǎ
    '@',
    '4',
  ],
  b: [
    '\u0432', // Cyrillic в
    '\u0412', // Cyrillic В
    '\u03b2', // Greek β
    '\u13cf', // Cherokee Ꮟ
    '8',
  ],
  c: [
    '\u0441', // Cyrillic с
    '\u03c2', // Greek ς
    '\u03c3', // Greek σ
    '\u00e7', // ç
    '\u0107', // ć
    '\u010d', // č
    '\u0109', // ĉ
    '(',
  ],
  d: [
    '\u0501', // Cyrillic ԁ
    '\u0111', // đ
    '\u010f', // ď
  ],
  e: [
    '\u0435', // Cyrillic е
    '\u0454', // Cyrillic є
    '\u03b5', // Greek ε
    '\u00e8', // è
    '\u00e9', // é
    '\u00ea', // ê
    '\u00eb', // ë
    '\u0113', // ē
    '\u0115', // ĕ
    '\u0117', // ė
    '\u0119', // ę
    '\u011b', // ě
    '\u1eb9', // ẹ
    '3',
  ],
  f: ['\u0192', '\u03c6'], // ƒ, Greek φ
  g: [
    '\u0121', // ġ
    '\u011f', // ğ
    '\u01e7', // ǧ
    '\u0123', // ģ
    '9',
    '6',
  ],
  h: [
    '\u04bb', // Cyrillic һ
    '\u0127', // ħ
    '\u0125', // ĥ
  ],
  i: [
    '\u0456', // Cyrillic і
    '\u0457', // Cyrillic ї
    '\u03b9', // Greek ι
    '\u00ec', // ì
    '\u00ed', // í
    '\u00ee', // î
    '\u00ef', // ï
    '\u0129', // ĩ
    '\u012b', // ī
    '\u012d', // ĭ
    '\u012f', // į
    '\u0131', // ı
    '1',
    '!',
    '|',
    'l',
  ],
  j: [
    '\u0458', // Cyrillic ј
    '\u0135', // ĵ
  ],
  k: [
    '\u043a', // Cyrillic к
    '\u03ba', // Greek κ
    '\u0137', // ķ
  ],
  l: [
    '\u04cf', // Cyrillic ӏ
    '\u0142', // ł
    '\u013e', // ľ
    '\u013c', // ļ
    '1',
    '|',
    'I',
  ],
  m: [
    '\u043c', // Cyrillic м
    '\u03bc', // Greek μ
  ],
  n: [
    '\u0438', // Cyrillic и
    '\u03b7', // Greek η
    '\u00f1', // ñ
    '\u0144', // ń
    '\u0148', // ň
    '\u0146', // ņ
  ],
  o: [
    '\u043e', // Cyrillic о
    '\u03bf', // Greek ο
    '\u03c9', // Greek ω
    '\u00f2', // ò
    '\u00f3', // ó
    '\u00f4', // ô
    '\u00f5', // õ
    '\u00f6', // ö
    '\u00f8', // ø
    '\u014d', // ō
    '\u014f', // ŏ
    '\u01d2', // ǒ
    '\u1ecd', // ọ
    '0',
  ],
  p: [
    '\u0440', // Cyrillic р
    '\u03c1', // Greek ρ
  ],
  q: ['\u051b'], // Cyrillic ԛ
  r: [
    '\u0433', // Cyrillic г
    '\u0155', // ŕ
    '\u0159', // ř
    '\u0157', // ŗ
  ],
  s: [
    '\u0455', // Cyrillic ѕ
    '\u03c3', // Greek σ
    '\u015b', // ś
    '\u0161', // š
    '\u015f', // ş
    '$',
    '5',
  ],
  t: [
    '\u0442', // Cyrillic т
    '\u03c4', // Greek τ
    '\u0165', // ť
    '\u0163', // ţ
    '\u021b', // ț
    '7',
    '+',
  ],
  u: [
    '\u0446', // Cyrillic ц
    '\u03c5', // Greek υ
    '\u00f9', // ù
    '\u00fa', // ú
    '\u00fb', // û
    '\u00fc', // ü
    '\u0169', // ũ
    '\u016b', // ū
    '\u016d', // ŭ
    '\u016f', // ů
    '\u0173', // ų
    '\u01d4', // ǔ
    '\u1ee5', // ụ
  ],
  v: [
    '\u03bd', // Greek ν
    '\u0475', // Cyrillic ѵ
  ],
  w: ['\u0175'], // ŵ
  x: [
    '\u0445', // Cyrillic х
    '\u03c7', // Greek χ
  ],
  y: [
    '\u0443', // Cyrillic у
    '\u00fd', // ý
    '\u00ff', // ÿ
    '\u0177', // ŷ
    '\u01b4', // ƴ
    '\u1ef3', // ỳ
    '\u1ef9', // ỹ
    '\u1ef7', // ỷ
    '\u1ef5', // ỵ
  ],
  z: [
    '\u017a', // ź
    '\u017c', // ż
    '\u017e', // ž
    '2',
  ],
};

// Build reverse lookup map for O(1) replacement
const homoglyphLookup = new Map<string, string>();
for (const [letter, variants] of Object.entries(homoglyphs)) {
  for (const variant of variants) {
    homoglyphLookup.set(variant, letter);
  }
}

/**
 * Normalize fullwidth Latin small letters (U+FF41 to U+FF5A) to ASCII
 */
function normalizeFullwidth(str: string): string {
  return str.replace(/[\uff41-\uff5a]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xff41 + 0x61)
  );
}

/**
 * Normalize fullwidth Latin capital letters (U+FF21 to U+FF3A) to lowercase ASCII
 */
function normalizeFullwidthUpper(str: string): string {
  return str.replace(/[\uff21-\uff3a]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xff21 + 0x61)
  );
}

/**
 * Strip zero-width characters that might be used to evade detection
 */
function stripZeroWidth(str: string): string {
  // Zero-width space, joiner, non-joiner, various format chars, BOM
  return str.replace(/[\u200b-\u200f\u2028-\u202f\u2060-\u206f\ufeff]/g, '');
}

/**
 * Normalize mathematical alphanumeric symbols (U+1D400-U+1D7FF) to ASCII
 * Covers: bold, italic, script, fraktur, double-struck, sans-serif, monospace variants
 */
function normalizeMathematical(str: string): string {
  const result: string[] = [];

  for (const char of str) {
    const code = char.codePointAt(0);
    if (!code) {
      result.push(char);
      continue;
    }

    // Mathematical Alphanumeric Symbols block: U+1D400 to U+1D7FF
    if (code >= 0x1d400 && code <= 0x1d7ff) {
      let mapped: string | null = null;

      // Mathematical Bold (A-Z): 1D400-1D419
      if (code >= 0x1d400 && code <= 0x1d419) {
        mapped = String.fromCharCode(code - 0x1d400 + 0x61); // to lowercase a-z
      }
      // Mathematical Bold (a-z): 1D41A-1D433
      else if (code >= 0x1d41a && code <= 0x1d433) {
        mapped = String.fromCharCode(code - 0x1d41a + 0x61);
      }
      // Mathematical Italic (A-Z): 1D434-1D44D
      else if (code >= 0x1d434 && code <= 0x1d44d) {
        mapped = String.fromCharCode(code - 0x1d434 + 0x61);
      }
      // Mathematical Italic (a-z): 1D44E-1D467
      else if (code >= 0x1d44e && code <= 0x1d467) {
        mapped = String.fromCharCode(code - 0x1d44e + 0x61);
      }
      // Mathematical Bold Italic (A-Z): 1D468-1D481
      else if (code >= 0x1d468 && code <= 0x1d481) {
        mapped = String.fromCharCode(code - 0x1d468 + 0x61);
      }
      // Mathematical Bold Italic (a-z): 1D482-1D49B
      else if (code >= 0x1d482 && code <= 0x1d49b) {
        mapped = String.fromCharCode(code - 0x1d482 + 0x61);
      }
      // Mathematical Script (A-Z): 1D49C-1D4B5
      else if (code >= 0x1d49c && code <= 0x1d4b5) {
        mapped = String.fromCharCode(code - 0x1d49c + 0x61);
      }
      // Mathematical Script (a-z): 1D4B6-1D4CF
      else if (code >= 0x1d4b6 && code <= 0x1d4cf) {
        mapped = String.fromCharCode(code - 0x1d4b6 + 0x61);
      }
      // Mathematical Bold Script (A-Z): 1D4D0-1D4E9
      else if (code >= 0x1d4d0 && code <= 0x1d4e9) {
        mapped = String.fromCharCode(code - 0x1d4d0 + 0x61);
      }
      // Mathematical Bold Script (a-z): 1D4EA-1D503
      else if (code >= 0x1d4ea && code <= 0x1d503) {
        mapped = String.fromCharCode(code - 0x1d4ea + 0x61);
      }
      // Mathematical Fraktur (A-Z): 1D504-1D51D
      else if (code >= 0x1d504 && code <= 0x1d51d) {
        mapped = String.fromCharCode(code - 0x1d504 + 0x61);
      }
      // Mathematical Fraktur (a-z): 1D51E-1D537
      else if (code >= 0x1d51e && code <= 0x1d537) {
        mapped = String.fromCharCode(code - 0x1d51e + 0x61);
      }
      // Mathematical Double-Struck (A-Z): 1D538-1D551
      else if (code >= 0x1d538 && code <= 0x1d551) {
        mapped = String.fromCharCode(code - 0x1d538 + 0x61);
      }
      // Mathematical Double-Struck (a-z): 1D552-1D56B
      else if (code >= 0x1d552 && code <= 0x1d56b) {
        mapped = String.fromCharCode(code - 0x1d552 + 0x61);
      }
      // Mathematical Bold Fraktur (A-Z): 1D56C-1D585
      else if (code >= 0x1d56c && code <= 0x1d585) {
        mapped = String.fromCharCode(code - 0x1d56c + 0x61);
      }
      // Mathematical Bold Fraktur (a-z): 1D586-1D59F
      else if (code >= 0x1d586 && code <= 0x1d59f) {
        mapped = String.fromCharCode(code - 0x1d586 + 0x61);
      }
      // Mathematical Sans-Serif (A-Z): 1D5A0-1D5B9
      else if (code >= 0x1d5a0 && code <= 0x1d5b9) {
        mapped = String.fromCharCode(code - 0x1d5a0 + 0x61);
      }
      // Mathematical Sans-Serif (a-z): 1D5BA-1D5D3
      else if (code >= 0x1d5ba && code <= 0x1d5d3) {
        mapped = String.fromCharCode(code - 0x1d5ba + 0x61);
      }
      // Mathematical Sans-Serif Bold (A-Z): 1D5D4-1D5ED
      else if (code >= 0x1d5d4 && code <= 0x1d5ed) {
        mapped = String.fromCharCode(code - 0x1d5d4 + 0x61);
      }
      // Mathematical Sans-Serif Bold (a-z): 1D5EE-1D607
      else if (code >= 0x1d5ee && code <= 0x1d607) {
        mapped = String.fromCharCode(code - 0x1d5ee + 0x61);
      }
      // Mathematical Sans-Serif Italic (A-Z): 1D608-1D621
      else if (code >= 0x1d608 && code <= 0x1d621) {
        mapped = String.fromCharCode(code - 0x1d608 + 0x61);
      }
      // Mathematical Sans-Serif Italic (a-z): 1D622-1D63B
      else if (code >= 0x1d622 && code <= 0x1d63b) {
        mapped = String.fromCharCode(code - 0x1d622 + 0x61);
      }
      // Mathematical Sans-Serif Bold Italic (A-Z): 1D63C-1D655
      else if (code >= 0x1d63c && code <= 0x1d655) {
        mapped = String.fromCharCode(code - 0x1d63c + 0x61);
      }
      // Mathematical Sans-Serif Bold Italic (a-z): 1D656-1D66F
      else if (code >= 0x1d656 && code <= 0x1d66f) {
        mapped = String.fromCharCode(code - 0x1d656 + 0x61);
      }
      // Mathematical Monospace (A-Z): 1D670-1D689
      else if (code >= 0x1d670 && code <= 0x1d689) {
        mapped = String.fromCharCode(code - 0x1d670 + 0x61);
      }
      // Mathematical Monospace (a-z): 1D68A-1D6A3
      else if (code >= 0x1d68a && code <= 0x1d6a3) {
        mapped = String.fromCharCode(code - 0x1d68a + 0x61);
      }

      result.push(mapped ?? char);
    } else {
      result.push(char);
    }
  }

  return result.join('');
}

/**
 * Replace homoglyphs in a string with their ASCII equivalents
 */
function replaceHomoglyphChars(str: string): string {
  const result: string[] = [];
  for (const char of str) {
    const replacement = homoglyphLookup.get(char);
    result.push(replacement ?? char);
  }
  return result.join('');
}

/**
 * Normalize a string by replacing all known homoglyphs with ASCII equivalents
 */
export function replaceHomoglyphs(str: string): string {
  let result = str;

  // Strip zero-width characters first
  result = stripZeroWidth(result);

  // Normalize fullwidth characters
  result = normalizeFullwidth(result);
  result = normalizeFullwidthUpper(result);

  // Normalize mathematical alphanumeric symbols
  result = normalizeMathematical(result);

  // Replace individual homoglyphs
  result = replaceHomoglyphChars(result);

  return result;
}
