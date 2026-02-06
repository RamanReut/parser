import { chromium } from 'playwright'
import { Reader } from './readers/Reader'
import { PdfRendererFactory } from './renderers/PdfRendererFactory'
import { Writer } from './writers/Writer'
import logger from './logger'

async function scrapeSPA(url: string): Promise<void> {
  logger.info(`Starting scrape of ${url}`)
  
  const browser = await chromium.launch({ 
    headless: false,
    chromiumSandbox: true
  })

  try {
    const rendererFactory = new PdfRendererFactory()
    const reader = new Reader(url, browser, rendererFactory)
    const writer = new Writer('test')

    const readerStream = reader.getStream()
    const writerStream = writer.getStream()

    await readerStream.pipeTo(writerStream)

    logger.info('Scraping completed successfully')
  } catch (error) {
    logger.error(error, 'Error during scraping')
  } finally {
    await browser.close()
  }
}

// Example usage
async function main() {
  await scrapeSPA('https://mangalib.me/ru/6435--kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen/read/v3/c23')
}

// Run the script
main().catch(console.error)