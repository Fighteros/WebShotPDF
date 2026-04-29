# WebShotPDF

WebShotPDF is a Node.js-based command-line tool that crawls an entire website (within the same domain), takes full-page literal screenshots of every page it finds, and compiles them into a single PDF document.

## Features

- **Automated Crawling**: Discovers and visits all internal links starting from a base URL.
- **Literal Screenshots**: Captures the visual state of each page exactly as rendered in a browser.
- **PDF Compilation**: Stitches all screenshots into a single, high-quality PDF.
- **Concurrency Support**: Process multiple pages simultaneously to speed up the capture process.
- **Safe Capture**: Limits to same-origin URLs to prevent crawling the entire web.
- **Smart Cleanup**: Automatically cleans up temporary image files after PDF generation.
- **Collision Prevention**: Generates randomized filenames by default (e.g., `webshot-xxxxxx.pdf`) to avoid overwriting previous captures.

## Installation

1. **Clone or download** this repository.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Install Playwright Browser**:
   ```bash
   npx playwright install chromium
   ```

## Usage

Use the `npm run capture` command followed by the URL of the site you want to capture.

### Basic Usage
```bash
npm run capture -- https://example.com
```
*Note: The `--` is required to pass arguments through npm to the application.*

### Advanced Options
```bash
npm run capture -- <url> [options]

Options:
  -V, --version              output the version number
  -o, --output <path>        Output PDF path (default: "webshot-xxxxxx.pdf")
  -c, --concurrency <num>    Number of concurrent pages to process (default: 3)
  -m, --max-pages <num>      Maximum number of pages to crawl (default: unlimited)
  -h, --help                 display help for command
```

### Examples

**Limit to 10 pages and set custom name:**
```bash
npm run capture -- https://example.com -o my-site.pdf -m 10
```

**High-speed capture (8 concurrent pages):**
```bash
npm run capture -- https://example.com -c 8
```

## How It Works

1. **Crawler**: Uses Playwright to navigate the site using a Breadth-First Search (BFS) algorithm.
2. **Screenshot Engine**: Captures full-page screenshots for each URL and stores them in a temporary system directory.
3. **PDF Generator**: Uses `pdf-lib` to create a new PDF, embedding each screenshot as a new page with dimensions matching the image.
4. **Cleanup**: Deletes all temporary images once the PDF is successfully written to disk.

## Requirements

- Node.js 16+
- Chromium (installed via Playwright)
