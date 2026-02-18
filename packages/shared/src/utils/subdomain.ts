export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomAlphanumeric(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export function generateSubdomain(appName: string): string {
  const slug = slugify(appName);
  const random = randomAlphanumeric(12);
  return `${slug}-${random}`;
}

export function generateContainerSubdomain(
  serviceSubdomain: string,
  containerType: string
): string {
  const short = randomAlphanumeric(4);
  return `${serviceSubdomain}-${containerType}-${short}`;
}
