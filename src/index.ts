import { chromium } from 'playwright'
import { PdfWriter } from './pdf/PdfWriter'
import logger from './logger'
import { getMangaLibReaderStream } from './mangaLib/readerFactory'

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
    const readerStream = getMangaLibReaderStream({ url, browser })
    const writer = new PdfWriter(outputPath)

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

