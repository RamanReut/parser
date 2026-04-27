import { Browser, chromium } from 'playwright'
import { getMangaLibReaderStream } from './readerFactory'
import { ChapterData } from '../common/ChapterData'
import { ChapterPiece } from '../common/chapterPieces/chapterPiece'
import { createHash } from 'node:crypto'

const url = 'https://mangalib.me/ru/manga/64302--one-day-my-lovely-ojou-chan-suddenly-became-a-cat-genshin-impact'

let browser: Browser

beforeAll(async () => {
    browser = await chromium.launch({ 
        headless: true,
        chromiumSandbox: true
    })
})

afterAll(async () => {
    await browser.close()
})

it('mangaLib reader', async () => {
    const readerStream = getMangaLibReaderStream({ browser, url})
    const buffer: ChapterData[] = []
    const writer = new WritableStream({
        async write(chunk) {
            buffer.push({
                ...chunk,
                data: chunk.data.map((x: ChapterPiece) => {
                    const hash = createHash('sha256').update(x.image)

                    return {
                        ...x,
                        image: hash.digest('base64')
                    }
                })
            })
        }
    })
    await readerStream.pipeTo(writer)

    expect(buffer).toMatchSnapshot()
})