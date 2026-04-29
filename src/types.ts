export interface PageInfo {
  url: string;
  screenshotPath?: string;
}

export interface CrawlerOptions {
  maxDepth?: number;
  concurrency?: number;
  maxPages?: number;
}
