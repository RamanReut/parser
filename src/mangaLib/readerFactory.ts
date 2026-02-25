import { Browser } from 'playwright'
import { MangaLibTitleReader } from './TitleReader'
import { MangaLibChapterTransformer } from './chapterTransformer'
interface IGetMangaLibReaderOptions {
    url: string,
    browser: Browser
}

export function getMangaLibReaderStream({
    browser,
    url
}: IGetMangaLibReaderOptions) {
    const titleReader = new MangaLibTitleReader(url, browser)
    const reader = titleReader.getStream()

    const chapterTransformer = new MangaLibChapterTransformer(browser)
    const transformer = chapterTransformer.getStream()

    return reader.pipeThrough(transformer)
}
