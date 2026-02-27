import { Browser } from 'playwright'
import { MangaLibTitleReader } from './TitleReader'
import { MangaLibChapterTransformer } from './chapterTransformer'
import logger from '../logger'

interface IGetMangaLibReaderOptions {
    url: string,
    browser: Browser
}

export function getMangaLibReaderStream({
    url,
    browser
}: IGetMangaLibReaderOptions): ReadableStream {
    logger.info(`Creating mangaLib reader stream for ${url}`)

    const titleReader = new MangaLibTitleReader(url, browser)
    const reader = titleReader.getStream()
    logger.info(`Title reader stream created for ${url}`)

    const chapterTransformer = new MangaLibChapterTransformer(browser)
    const transformer = chapterTransformer.getStream()
    logger.info(`Chapter transformer stream created for ${url}`)

    logger.info(`Chaining streams together for ${url}`)
    const result = reader.pipeThrough(transformer)
    logger.info(`Reader stream pipeline created successfully for ${url}`)

    return result
} 
