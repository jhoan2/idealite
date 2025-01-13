export const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

export const getHostname = (url: string): string => {
  try {
    if (!isValidUrl(url)) return "";
    return new URL(url).hostname;
  } catch (e) {
    return "";
  }
};

export const isTwitterUrl = (url: string): boolean => {
  const hostname = getHostname(url);
  return hostname.includes("twitter.com") || hostname.includes("x.com");
};

export const isYouTubeUrl = (url: string): boolean => {
  const hostname = new URL(url).hostname;
  return hostname.includes("youtube.com") || hostname.includes("youtu.be");
};
