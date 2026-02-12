import { chromium } from 'playwright'
import { MangaLibChapterReader } from './mangaLib/chapterReader'
import { PdfRendererFactory } from './pdf/PdfRendererFactory'
import { PdfWriter } from './pdf/PdfWriter'
import logger from './logger'

async function scrapeSPA(
  url: string,
  visibleBrowser: boolean = false,
  outputPath: string = 'output/output'
): Promise<void> {
  logger.info(`Starting scrape of ${url}`)
  
  const browser = await chromium.launch({ 
    headless: !visibleBrowser,
    chromiumSandbox: true
  })

  try {
    const rendererFactory = new PdfRendererFactory()
    const reader = new MangaLibChapterReader(url, browser, rendererFactory)
    const writer = new PdfWriter(outputPath)

    const readerStream = reader.getStream()
    const writerStream = writer.getStream()

    await readerStream.pipeTo(writerStream)

    logger.info('Scraping completed successfully')
  } catch (error) {
    logger.error(error, 'Error during scraping')
    throw error
  } finally {
    await browser.close()
  }
}

export { scrapeSPA }

