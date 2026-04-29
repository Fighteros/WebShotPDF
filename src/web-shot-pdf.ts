import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PageInfo, CrawlerOptions } from './types';
import { PDFDocument } from 'pdf-lib';
import * as SingleBar from 'cli-progress';

export class WebShotPDF {
  private visited = new Set<string>();
  private queue: string[] = [];
  private pages: PageInfo[] = [];
  private baseUrl: URL;
  private tempDir: string;
  private progressBar: any;

  constructor(startUrl: string, private options: CrawlerOptions = {}) {
    this.baseUrl = new URL(startUrl);
    this.queue.push(this.baseUrl.href);
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-shot-pdf-'));
    this.progressBar = new SingleBar.SingleBar({}, SingleBar.Presets.shades_classic);
  }

  async run(outputPath: string) {
    console.log(`Starting crawl of ${this.baseUrl.origin}...`);
    const browser = await chromium.launch();
    
    try {
      this.progressBar.start(1, 0); // Start with 1 as we know there's at least one page
      
      let processedCount = 0;
      while (this.queue.length > 0) {
        if (this.options.maxPages && processedCount >= this.options.maxPages) {
          console.log(`\nReached max pages limit (${this.options.maxPages}). Stopping.`);
          break;
        }

        const batch = this.queue.splice(0, this.options.concurrency || 1);
        const promises = batch.map(url => this.processPage(browser, url));
        await Promise.all(promises);
        
        processedCount += batch.length;
        this.progressBar.setTotal(processedCount + this.queue.length);
        this.progressBar.update(processedCount);
      }
      
      this.progressBar.stop();
      console.log(`\nCrawl complete. Captured ${this.pages.length} pages.`);
      
      await this.generatePdf(outputPath);
      
    } finally {
      await browser.close();
      this.cleanup();
    }
  }

  private async processPage(browser: Browser, url: string) {
    if (this.visited.has(this.normalizeUrl(url))) return;
    this.visited.add(this.normalizeUrl(url));

    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      
      const screenshotPath = path.join(this.tempDir, `screenshot-${this.pages.length}.png`);
      await page.screenshot({ fullPage: true, path: screenshotPath });
      
      this.pages.push({ url, screenshotPath });
      
      const links = await this.extractLinks(page);
      for (const link of links) {
        if (!this.visited.has(this.normalizeUrl(link)) && !this.queue.includes(link)) {
          this.queue.push(link);
        }
      }
    } catch (err: any) {
      console.error(`\nFailed to process ${url}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  private async extractLinks(page: Page): Promise<string[]> {
    const links = await page.$$eval('a', (anchors) => anchors.map(a => a.href));
    return links.filter(link => {
      try {
        const url = new URL(link);
        return url.origin === this.baseUrl.origin && 
               !link.includes('#') && 
               !/\.(zip|pdf|jpg|jpeg|png|gif|mp4|exe|dmg)$/i.test(url.pathname);
      } catch {
        return false;
      }
    });
  }

  private normalizeUrl(url: string): string {
    const u = new URL(url);
    u.hash = '';
    return u.href.replace(/\/$/, '');
  }

  private async generatePdf(outputPath: string) {
    console.log('Generating PDF...');
    const pdfDoc = await PDFDocument.create();

    for (const pageInfo of this.pages) {
      if (!pageInfo.screenshotPath) continue;
      
      const imgBytes = fs.readFileSync(pageInfo.screenshotPath);
      const img = await pdfDoc.embedPng(imgBytes);
      
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`PDF saved to: ${path.resolve(outputPath)}`);
  }

  private cleanup() {
    try {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}
