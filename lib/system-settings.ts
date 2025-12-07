import { prisma } from "./db";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedSetting = {
  value: string | null;
  timestamp: number;
};

const cache = new Map<string, CachedSetting>();

function getFromCache(key: string): string | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  const isStale = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isStale) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
}

function setCache(key: string, value: string | null) {
  cache.set(key, { value, timestamp: Date.now() });
}

export function clearSystemSettingCache(keys?: string[]) {
  if (!keys) {
    cache.clear();
    return;
  }

  keys.forEach((key) => cache.delete(key));
}

export async function getSystemSetting(
  key: string,
  fallback?: string | null
): Promise<string | null> {
  const cached = getFromCache(key);
  if (cached !== undefined) {
    return cached;
  }

  const record = await prisma.systemSettings.findUnique({
    where: { key },
  });

  const value = record?.value ?? fallback ?? null;
  setCache(key, value);

  return value;
}

export async function getOpenRouterApiKey(): Promise<string> {
  const fallback = process.env.OPENROUTER_API_KEY || null;
  const value = await getSystemSetting("openRouterApiKey", fallback);
  return value || "";
}

export async function getBlocksProjectKey(): Promise<string> {
  const fallback =
    process.env.NEXT_PUBLIC_X_BLOCKS_KEY ||
    process.env.VITE_X_BLOCKS_KEY ||
    null;
  const value = await getSystemSetting("blocksProjectKey", fallback);
  return value || "";
}
