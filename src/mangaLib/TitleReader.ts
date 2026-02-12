import logger from '../logger'
import { PageReader } from '../common/PageReader'
import { Chapter } from '../common/Chapter'

const cookieConsentContent = 'Мы используем файлы cookie, чтобы сайт работал лучше, оставаясь с нами вы соглашаетесь на такое использование'
const cookieConsentOk = 'ОК'
const chapterTabTitle = 'Главы'
const sortOrderButtonTitle = 'Сортировать'
const volumeTitle = 'Том'
const chapterTitle = 'Глава'

export class MangaLibTitleReader extends PageReader {
    private volumeIdCursor = 0

    private async closeCookieConsent() {
        try {
            logger.info('Closing cookie consent start')

            const okButton = this.browserPage
                .locator('div', {
                    hasText: cookieConsentContent,
                    has: this.browserPage.locator('button').getByText(cookieConsentOk, { exact: false })
                })
                .getByRole('button', {name: cookieConsentOk, exact: true })
            await okButton.waitFor()
            await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

            await okButton.click({ delay: this.getClickTimePeriod() })
            logger.info('Cookie consent closed successfully')
        } catch (error) {
            logger.warn(error, 'Cannot close cookie consent')
            throw error
        }
    }

    private async openSectionPage() {
        const chapterTab = await this.browserPage.getByText(chapterTabTitle)
        await chapterTab.click({ delay: this.getClickTimePeriod()})
    }

    private async changeSortOrder() {
        const sortOrderButton = await this.browserPage.getByRole('button', { name: sortOrderButtonTitle })
        await sortOrderButton.click({delay: this.getClickTimePeriod()})           
    }

    private async initializeVolumeId() {
        const firstChapter = await this.browserPage.getByText(volumeTitle).first()
        await firstChapter.waitFor()
        const text = (await firstChapter.allInnerTexts())[0]

        const volumeCaptureRegexp = new RegExp(`${volumeTitle} (\\d+) ${chapterTitle}`)
        const volumeId = volumeCaptureRegexp.exec(text)?.[1]

        if (volumeId) {
            this.volumeIdCursor = parseInt(volumeId, 10)
        } else {
            throw Error('Cannot parse volume id')
        }
    }
   
    private async initializeChapterList() {
        await this.openSectionPage()
        await this.changeSortOrder()
        await this.initializeVolumeId()
    }

    private async getChaptersBatchFrom(volumeId: number, chapterId: number) {
        const prefix = `${volumeTitle} ${volumeId} ${chapterTitle}`
        const chapterElements = await this.browserPage.getByRole('link', { name: prefix }).all()
        const parseRegexp = new RegExp(`${prefix} (\\d+)( - (.+))?`)
        
        const result = await Promise.all(
            chapterElements.map(async (locator) => {
                const link = await locator.getAttribute('href')
                const innerText = await locator.innerText()
                const textParseResult = parseRegexp.exec(innerText)
                
                if (textParseResult && link) {
                    const [_1, id, _2, title] = textParseResult
                    const parsedId = parseFloat(id)

                    return new Chapter(link, parsedId, title)
                } else {
                    throw new Error('Cannot parse text from chapter title')
                }
            })
        )

        return result.filter(chapter => chapter.id >= chapterId)
    }

    // private collectChapterForVolume(volumeId: number) {
        
    // }

    private async scrollToText(volumeId: number, chapterId: number) {

    }

    private async getVolume() {
        const chapterAccumulator = []
        let chapterIdCursor = 0
        let batch

        do {
            batch = await this.getChaptersBatchFrom(this.volumeIdCursor, chapterIdCursor)
            if (batch) {
                chapterAccumulator.push(...batch)
                chapterIdCursor = batch[batch.length - 1].id
                
            }
        } while (batch)
    }

    async read() {
        return this.getChaptersBatchFrom(this.volumeIdCursor, 0)
    }

    async initialize() {
        logger.info('Starting reader initialization')

        await this.openPage()
        await this.closeCookieConsent()
        await this.initializeChapterList()

        logger.info('Reader initialization complete')
    }

    // getStream() {
        
    // }
}