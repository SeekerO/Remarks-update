export default function extractIdFromUrl(url: string) {
  const match = url.match(/\/d\/(.*?)\//);
  // If a match is found, the ID is in the first capturing group (index 1)
  if (match && match[1]) {
    return match[1];
  }
  return url; // Or throw an error, or return an empty string if not found
}
