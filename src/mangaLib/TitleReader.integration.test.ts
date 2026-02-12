import { Browser, chromium } from 'playwright'
import { MangaLibTitleReader } from './TitleReader'

const url = 'https://mangalib.me/ru/manga/6435--kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen'

let browser: Browser

beforeAll(async () => {
    browser = await chromium.launch({ 
        headless: false,
        chromiumSandbox: true
    })
})

afterAll(async () => {
    await browser.close()
})

it('mangaLib title reader', async () => {
    const reader = new MangaLibTitleReader(url, browser, false)
    await reader.initialize()
    const result = await reader.read()
    console.log('hi')
})