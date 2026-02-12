# Manga Scraper Application

This is a manga scraping application that uses Playwright to navigate web pages and extract images, then converts them to a PDF using pdfmake.

## Project Structure

```
src/
├── main.ts                 # Main application entry point
├── logger.ts                # Logging configuration using pino
├── mangaLib/
│   ├── chapterReader.ts     # Core scraping logic using Playwright
│   └── chapterReader.test.ts # Tests for chapter reader
├── pdf/
│   ├── PdfImageRenderer.ts  # Converts image buffers to PDF format
│   ├── PdfImageRenderer.test.ts # Tests for PDF image renderer
│   ├── PdfRendererFactory.ts # Factory for creating PDF renderers
│   ├── PdfWriter.ts         # Writes PDF files using pdfmake
│   └── PdfWriter.test.ts    # Tests for PDF writer
├── types/
│   └── renderer.d.ts        # Type definitions for renderers
```

## Key Components

### 1. Main Application (main.ts)
- Exports `scrapeSPA` function for direct use in other modules
- Supports `--visible-browser` (-v) flag to show browser during scraping
- Supports `--output` (-o) flag to specify output file path
- Default output is 'output.pdf'
- Uses Playwright to launch Chromium browser
- Initializes Reader, RendererFactory, and Writer components

### 2. Chapter Reader (mangaLib/chapterReader.ts)
- Uses Playwright to navigate web pages
- Handles cookie consent dialogs
- Extracts images from pages using data-page attributes
- Implements a ReadableStream for efficient data flow
- Adds random delays to mimic human behavior

### 3. PDF Renderer Components
- **PdfRendererFactory**: Factory for creating PDF renderers
- **PdfImageRenderer**: Converts image buffers to PDF format with sizing options
- **PdfWriter**: Writes PDF files using pdfmake library

### 4. Types (types/renderer.d.ts)
- Defines interfaces for renderers and factories
- Ensures type safety across components

## Features

1. **Web Scraping**: Uses Playwright to navigate SPA websites
2. **Image Extraction**: Captures images from web pages
3. **PDF Generation**: Converts extracted images to PDF format
4. **Browser Automation**: Supports both headless and visible browser modes
5. **Error Handling**: Comprehensive error handling and logging
6. **Testing**: Full test coverage for all components

## Usage

```bash
# Basic usage
npm run start -- https://example.com

# Show browser during scraping
npm run start -- https://example.com -v

# Specify output file
npm run start -- https://example.com -o result.pdf
```

## Testing

The application includes comprehensive tests for all components:
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

Tests cover:
- PDF writer functionality
- PDF image renderer functionality  
- Chapter reader scraping logic
- Stream handling and error conditions

## Dependencies

- **playwright**: Web scraping and browser automation
- **pdfmake**: PDF generation
- **pdf-lib**: Enhanced PDF manipulation and creation. Use only in tests
- **yargs**: Command line argument parsing
- **pino**: Logging
- **jest**: Testing framework
- **typescript**: Type safety

## Build Process

```bash
npm run build    # Compile TypeScript to JavaScript
npm run dev      # Run in development mode with watch
npm test         # Run all tests
npm run test:unit # Run unit tests
npm run test:integration # Run integration tests
```

## Configuration

The application uses a default viewport size of 4096x2100 pixels for consistent image capture.
Random delays are added between actions to mimic human browsing behavior.
Cookie consent handling is implemented for sites that require it.

## Output Format

The application generates PDF files with images arranged in the order they were scraped from the source website. Images are automatically scaled to fit within the specified page width while maintaining aspect ratio.
