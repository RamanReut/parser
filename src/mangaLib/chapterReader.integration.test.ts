import { createHash } from 'crypto'
import { Browser, chromium } from 'playwright'
import { MangaLibChapterReader } from './chapterReader'

const url = 'https://mangalib.me/ru/33964--seishun-buta-yarou-6-koma/read/v1/c1'

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

it('mangaLib chapter reader', async () => {
    const reader = new MangaLibChapterReader(url, browser)
    await reader.initialize()
    const result = await reader.read()

    expect(result.map(x => {
        const imageHash = createHash('sha256').update(x.image)

        return {
            ...x,
            image: imageHash.digest('base64')
        }
    })).toMatchSnapshot()
})
