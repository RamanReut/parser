# Manga Scraper Application

This is a manga scraping application that uses Playwright to navigate web pages and extract images, then converts them to PDFs using pdfmake.

## Project Structure

```
src/
├── index.ts                 # Application entry point, exports scrapeSPA function
├── main.ts                  # CLI interface with yargs
├── logger.ts                # Logging configuration using pino
├── mangaLib/
│   ├── MangaLibPageReader.ts # MangaLib-specific PageReader with cookie consent handling
│   ├── chapterReader.ts     # Core scraping logic using Playwright
│   ├── chapterReader.unit.test.ts # Unit tests for chapter reader
│   ├── chapterReader.integration.test.ts # Integration tests for chapter reader
│   ├── TitleReader.ts       # Title page reader that navigates to specific manga pages
│   ├── TitleReader.integration.test.ts # Integration tests for title reader
│   ├── chapterTransformer.ts # Transforms chapter metadata and data into ChapterData
│   └── readerFactory.ts     # Factory for creating reader streams with pipeline processing
├── pdf/
│   ├── PdfImageRenderer.ts  # Converts image buffers to PDF format
│   ├── PdfImageRenderer.unit.test.ts # Unit tests for PDF image renderer
│   ├── PdfRendererFactory.ts # Factory for creating PDF renderers
│   └── PdfWriter.ts         # Writes individual PDF files using pdfmake
├── common/
│   ├── PageReader.ts        # Abstract base class for page readers with browser/page management
│   ├── ChapterMetadata.ts   # Metadata for individual chapters
│   ├── ChapterData.ts       # Type definition combining metadata and data
│   └── chapterPieces/
│       ├── ImageArticle.ts  # Represents an image with dimensions for PDF rendering
│       └── chapterPiece.d.ts # Type definitions for chapter pieces
├── types/
│   └── renderer.d.ts        # Type definitions for renderers
tests/
├── integration/
│   └── mangaLib.integration.test.ts # Integration tests for manga library components
```

## Key Components

### 1. Main Application (main.ts)
- CLI interface using yargs
- Supports `--visible-browser` (-v) flag to show browser during scraping
- Supports `--output` (-o) flag to specify output directory path
- Default output is 'output' (PDFs are organized in subdirectories by title/volume)
- Orchestrates the scraping process by calling scrapeSPA

### 2. Application Entry (index.ts)
- Exports `scrapeSPA` function for direct use in other modules
- Accepts `options` object with `visibleBrowser` and `output` properties
- Uses Playwright to launch Chromium browser
- Creates reader pipeline inline (TitleReader → ChapterTransformer → PdfWriter)
- Implements stream pipeline using pipeTo for efficient data flow
- Default output is 'output'

### 3. Pipeline Architecture
- **Title Reader (mangaLib/TitleReader.ts)**: Extends MangaLibPageReader base class
  - Handles cookie consent dialogs
  - Navigates to chapter sections
  - Changes sort order (descending by chapter ID)
  - Extracts chapter metadata from volume/section pages
  - Implements pagination for loading all chapters
  - Returns chapter metadata via ReadableStream
  
- **Chapter Transformer (mangaLib/chapterTransformer.ts)**: Transforms stream data
  - Takes ChapterMetadata and extracts full chapter data
  - Uses MangaLibChapterReader for image extraction
  - Enqueues ChapterData objects to stream
  
- **Chapter Reader (mangaLib/chapterReader.ts)**: Extends MangaLibPageReader base class
  - Uses Playwright to navigate chapter pages
  - Handles cookie consent dialogs
  - Extracts images from pages using data-page attributes
  - Implements ReadableStream for efficient data flow
  - Adds random delays to mimic human behavior

- **Reader Factory (mangaLib/readerFactory.ts)**: Alternative factory for creating reader streams
  - Creates pipeline of TitleReader and ChapterTransformer
  - Can be used as an alternative to inline stream creation

### 4. Base Components
- **PageReader (common/PageReader.ts)**: Abstract base class for all readers
  - Manages browser and page lifecycle
  - Configures viewport size (4096x2100) for consistent image capture
  - Provides helper methods for random delays and timing
  - Ensures proper page initialization and cleanup
  
- **MangaLibPageReader (mangaLib/MangaLibPageReader.ts)**: MangaLib-specific PageReader
  
- **ChapterData (common/ChapterData.ts)**: Combined data structure
  - Contains metadata (ChapterMetadata) and image data (ChapterPiece[])
  - Used for passing chapter information through the pipeline
  
- **ImageArticle (common/chapterPieces/ImageArticle.ts)**: Image representation
  - Stores image buffer with width and height
  - Calculates aspect ratio for PDF rendering

### 5. PDF Renderer Components
- **PdfRendererFactory**: Factory for creating PDF renderers
- **PdfImageRenderer**: Converts image buffers to PDF format with sizing options
- **PdfWriter**: Writes individual PDF files using pdfmake library

### 6. Types (types/renderer.d.ts)
- Defines interfaces for renderers and factories
- Ensures type safety across components

## Features

1. **Web Scraping**: Uses Playwright to navigate SPA websites
2. **Image Extraction**: Captures images from web pages
3. **PDF Generation**: Converts extracted images to individual PDF files
4. **Browser Automation**: Supports both headless and visible browser modes
5. **Error Handling**: Comprehensive error handling and structured logging
6. **Testing**: Full test coverage for all components
7. **Pipeline Processing**: Uses TransformStream and pipeTo for efficient data flow
8. **Modular Architecture**: Separated concerns with factory pattern and base classes
9. **Metadata Extraction**: Extracts chapter titles and IDs from source
10. **Pagination**: Handles loading all chapters from a volume
11. **Directory-based Output**: Organizes PDFs in subdirectories by title and volume

## Usage

```bash
# Basic usage
npm run start -- https://mangalib.me

# Show browser during scraping
npm run start -- https://mangalib.me -v

# Specify output directory
npm run start -- https://mangalib.me -o output/chapters
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
- Title reader navigation and metadata extraction
- Stream handling and error conditions
- Reader factory pipeline creation
- Chapter transformer data transformation

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

The application uses a default viewport size of 4096x2100 pixels for consistent image capture. Random delays are added between actions to mimic human browsing behavior. Cookie consent handling is implemented for sites that require it.

## Output Format

The application generates multiple PDF files, one per chapter, organized in a directory structure:
- Output directory is specified via `--output` flag (default: 'output')
- PDFs are stored in `{output}/{titleName}/{volumeId}_{chapterId}_{title}.pdf`
- Images within each PDF are arranged in the order they were scraped from the source website
- Images are automatically scaled to fit within the specified page width while maintaining aspect ratio

## Architecture Highlights

The refactored architecture introduces several key improvements:

1. **Pipeline Processing**: Uses JavaScript Streams API (ReadableStream, TransformStream) to create an efficient data pipeline
2. **Base Class Pattern**: PageReader base class provides common functionality for different reader types
3. **Factory Pattern**: readerFactory creates complex reader combinations with proper stream connections
4. **Modular Design**: Separated concerns between title navigation, chapter extraction, and data transformation
5. **Type Safety**: Comprehensive TypeScript interfaces ensure type consistency across the pipeline
6. **Stream-based Architecture**: Eliminates manual buffer management and enables efficient data flow
7. **Structured Error Logging**: Uses Pino's structured logging with `{ err: error }` for proper error serialization
8. 