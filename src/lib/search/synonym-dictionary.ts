import synonymsConfig from "./config/synonyms.json";

const reverseIndex = new Map<string, string[]>();

function buildReverseIndex(): void {
  for (const aliases of Object.values(synonymsConfig)) {
    for (const alias of aliases) {
      const existing = reverseIndex.get(alias);
      if (existing) {
        const merged = new Set([...existing, ...aliases]);
        const mergedArray = [...merged];
        reverseIndex.set(alias, mergedArray);
        for (const term of mergedArray) {
          reverseIndex.set(term, mergedArray);
        }
      } else {
        reverseIndex.set(alias, aliases);
      }
    }
  }
}

buildReverseIndex();

export function expand(tokens: string[]): string[] {
  const expanded = new Set(tokens);

  // Single-token lookup
  for (const token of tokens) {
    const aliases = reverseIndex.get(token);
    if (aliases) {
      for (const alias of aliases) {
        expanded.add(alias);
      }
    }
  }

  // Multi-word lookup: try adjacent pairs and triples
  for (let i = 0; i < tokens.length; i++) {
    if (i + 1 < tokens.length) {
      const pair = `${tokens[i]} ${tokens[i + 1]}`;
      const pairAliases = reverseIndex.get(pair);
      if (pairAliases) {
        for (const alias of pairAliases) {
          expanded.add(alias);
        }
      }
    }
    if (i + 2 < tokens.length) {
      const triple = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      const tripleAliases = reverseIndex.get(triple);
      if (tripleAliases) {
        for (const alias of tripleAliases) {
          expanded.add(alias);
        }
      }
    }
  }

  return [...expanded];
}

export function getOriginals(): string[] {
  return Object.keys(synonymsConfig);
}

export function hasSynonym(token: string): boolean {
  return reverseIndex.has(token);
}
