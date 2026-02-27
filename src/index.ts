import { Browser, chromium } from 'playwright'
import { MangaLibTitleReader } from './mangaLib/TitleReader'
import { MangaLibChapterTransformer } from './mangaLib/chapterTransformer'
import { PdfRendererFactory } from './pdf/PdfRendererFactory'
import { PdfWriter } from './pdf/PdfWriter'
import logger from './logger'

export async function scrapeSPA(
  url: string,
  options: {
    visibleBrowser?: boolean
    output?: string
  }
) {
  logger.info(`Starting SPA scraping for ${url}`)
  const browser: Browser = await chromium.launch({
    headless: !options.visibleBrowser,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const readerFactory = (url: string, browser: Browser) => {
      const titleReader = new MangaLibTitleReader(url, browser)
      const reader = titleReader.getStream()

      const chapterTransformer = new MangaLibChapterTransformer(browser)
      const transformer = chapterTransformer.getStream()

      return reader.pipeThrough(transformer)
    }

    const writer = new PdfWriter(options.output || 'output/output')

    logger.info(`Starting pipeline execution for ${url}`)

    await readerFactory(url, browser)
      .pipeTo(writer.getStream())

    logger.info(`Pipeline execution completed successfully for ${url}`)
  } catch (error) {
    logger.error(error, `Error during SPA scraping for ${url}`)
    throw error
  } finally {
    await browser.close()
    logger.info(`Browser closed for ${url}`)
  }
}
