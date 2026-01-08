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

export async function getSeliseClientId(): Promise<string> {
  const fallback = process.env.SELISE_CLIENT_ID || null;
  const value = await getSystemSetting("seliseClientId", fallback);
  return value || "";
}

export async function getSeliseClientSecret(): Promise<string> {
  const fallback = process.env.SELISE_CLIENT_SECRET || null;
  const value = await getSystemSetting("seliseClientSecret", fallback);
  return value || "";
}

/**
 * Get SELISE credentials with organization-level override support
 * Priority: Org credentials -> System settings -> Environment variables
 *
 * @param orgId - Optional organization ID to check for org-specific credentials
 * @returns Object with clientId, clientSecret, and source indicating where credentials came from
 */
export async function getSeliseCredentialsForOrg(orgId?: string | null): Promise<{
  clientId: string;
  clientSecret: string;
  source: "organization" | "system" | "env";
}> {
  // If orgId provided, check organization credentials first
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { seliseClientId: true, seliseClientSecret: true },
    });

    // If org has both credentials configured, use them
    if (org?.seliseClientId && org?.seliseClientSecret) {
      return {
        clientId: org.seliseClientId,
        clientSecret: org.seliseClientSecret,
        source: "organization",
      };
    }
  }

  // Fall back to system settings (which itself falls back to env vars)
  const [clientId, clientSecret] = await Promise.all([
    getSeliseClientId(),
    getSeliseClientSecret(),
  ]);

  // Determine if we're using system settings or env vars
  const systemSetting = await prisma.systemSettings.findUnique({
    where: { key: "seliseClientId" },
  });

  const source = systemSetting?.value ? "system" : "env";

  return {
    clientId,
    clientSecret,
    source,
  };
}
