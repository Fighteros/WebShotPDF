import { Command } from 'commander';
import { WebShotPDF } from './web-shot-pdf';

const program = new Command();

const randomSuffix = Math.random().toString(36).substring(2, 8);
const defaultOutput = `webshot-${randomSuffix}.pdf`;

program
  .name('web-shot-pdf')
  .description('Crawl a domain and save screenshots of all pages to a single PDF')
  .version('1.0.0')
  .argument('<url>', 'Starting URL to crawl')
  .option('-o, --output <path>', 'Output PDF path', defaultOutput)
  .option('-c, --concurrency <number>', 'Number of concurrent pages to process', '3')
  .option('-m, --max-pages <number>', 'Maximum number of pages to crawl', '0')
  .action(async (url, options) => {
    try {
      const startUrl = url.startsWith('http') ? url : `https://${url}`;
      const pager = new WebShotPDF(startUrl, {
        concurrency: parseInt(options.concurrency, 10),
        maxPages: parseInt(options.maxPages, 10) || undefined
      });
      await pager.run(options.output);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
