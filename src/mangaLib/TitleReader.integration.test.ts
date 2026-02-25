import { Browser, chromium } from 'playwright'
import { MangaLibTitleReader } from './TitleReader'
import { ChapterMetadata } from '../common/ChapterMetadata'

const url = 'https://mangalib.me/ru/manga/6435--kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen'

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

it('mangaLib title reader', async () => {
    const reader = new MangaLibTitleReader(url, browser)
    const readerStream = reader.getStream()
    const buffer: ChapterMetadata[] = []
    const writer = new WritableStream({
        write(chunk) {
            buffer.push(chunk)
        }
    })

    await readerStream.pipeTo(writer)

    expect(buffer).toMatchSnapshot()
})