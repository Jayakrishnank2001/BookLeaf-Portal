// Small deterministic string hash. Used to give each book / user a stable colour
// without storing any presentation data in the database.
export function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}
