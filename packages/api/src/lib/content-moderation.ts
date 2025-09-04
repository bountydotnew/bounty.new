export interface PurgoMalumResponse {
  result: string;
}

export interface PurgoMalumContainsResponse {
  containsProfanity: boolean;
}

function normalizeText(text: string): string {
  const patterns = [
    { pattern: /s\*?h\*?i\*?t/gi, replacement: "shit" },
    { pattern: /f\*?u\*?c\*?k/gi, replacement: "fuck" },
    { pattern: /f\*?u\*?k/gi, replacement: "fuk" },
    { pattern: /b\*?i\*?t\*?c\*?h/gi, replacement: "bitch" },
    { pattern: /h\*?e\*?l\*?l/gi, replacement: "hell" },
    { pattern: /a\*?s\*?s/gi, replacement: "ass" },
    { pattern: /p\*?i\*?s\*?s/gi, replacement: "piss" },
    { pattern: /c\*?r\*?a\*?p/gi, replacement: "crap" },
    { pattern: /s\*?t\*?u\*?p\*?i\*?d/gi, replacement: "stupid" },
    { pattern: /i\*?d\*?i\*?o\*?t/gi, replacement: "idiot" },
  ];

  let normalizedText = text;
  patterns.forEach(({ pattern, replacement }) => {
    normalizedText = normalizedText.replace(pattern, replacement);
  });
  return normalizedText;
}

export async function containsProfanity(text: string): Promise<boolean> {
  try {
    const normalizedText = normalizeText(text);
    const response = await fetch(
      `https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(normalizedText)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    if (!response.ok) return false;
    const data = await response.text();
    return data.toLowerCase() === "true";
  } catch {
    return false;
  }
}

export async function filterProfanity(text: string, fillText: string = "***"): Promise<string> {
  try {
    const normalizedText = normalizeText(text);
    const url = new URL("https://www.purgomalum.com/service/plain");
    url.searchParams.append("text", normalizedText);
    if (fillText !== "***") url.searchParams.append("fill_text", fillText);
    const response = await fetch(url.toString(), { method: "GET", headers: { "Content-Type": "application/json" } });
    if (!response.ok) return text;
    return await response.text();
  } catch {
    return text;
  }
}

export async function moderateComment(content: string): Promise<{ isClean: boolean; filteredContent: string }> {
  const hasProfanity = await containsProfanity(content);
  if (hasProfanity) {
    const filteredContent = await filterProfanity(content);
    return { isClean: false, filteredContent };
  }
  return { isClean: true, filteredContent: content };
}


