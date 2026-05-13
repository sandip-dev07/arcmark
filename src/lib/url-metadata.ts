import ogs from 'open-graph-scraper'

export function URLIcon(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function URLTitle(){
  
}