/** Shared URL syntax policy. No requests, redirects, or provider scripts. */
export function parseWebUrl(value: string, httpsOnly = false): URL | undefined {
 if (typeof value !== 'string' || !/^https?:\/\/[^/]/i.test(value) || /[\s\\\u0000-\u001f\u007f]/u.test(value) || /%(?![\da-f]{2})/i.test(value) || /%(?:0[\da-f]|1[\da-f]|7f)/i.test(value)) return undefined;
 try {
  const url = new URL(value);
  if (!(httpsOnly ? url.protocol === 'https:' : ['https:','http:'].includes(url.protocol)) || url.username || url.password || !url.hostname || url.port) return undefined;
  return url;
 } catch { return undefined; }
}
export function isHttpUrl(value: string): boolean { return Boolean(parseWebUrl(value)); }
export function isHttpsUrl(value: string): boolean { return Boolean(parseWebUrl(value,true)); }
export const isGiftRegistryUrl = isHttpsUrl;
