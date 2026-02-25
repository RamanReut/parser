import { Browser } from 'playwright'
import { ChapterMetadata } from '../common/ChapterMetadata'
import { MangaLibChapterReader } from './chapterReader'
import { ChapterData } from '../common/ChapterData'

export class MangaLibChapterTransformer {
    constructor(private browser: Browser) {}

    protected async transform(chapter: ChapterMetadata, controller: TransformStreamDefaultController) {
        const reader = new MangaLibChapterReader(chapter.link, this.browser)
        await reader.initialize()

        const data = await reader.read()
        const chapterData = {
            metadata: chapter,
            data: data
        } as ChapterData
        
        controller.enqueue(chapterData)
    }

    getStream() {
        return new TransformStream({
            transform: this.transform.bind(this)
        })
    }
}
