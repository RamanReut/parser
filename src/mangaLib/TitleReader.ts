import logger from '../logger'
import { PageReader } from '../common/PageReader'
import { ChapterMetadata } from '../common/ChapterMetadata'

const URL_BASE = 'https://mangalib.me'

const cookieConsentContent = 'Мы используем файлы cookie, чтобы сайт работал лучше, оставаясь с нами вы соглашаетесь на такое использование'
const cookieConsentOk = 'ОК'
const chapterTabTitle = 'Главы'
const sortOrderButtonTitle = 'Сортировать'
const volumeTitle = 'Том'
const chapterTitle = 'Глава'

export class MangaLibTitleReader extends PageReader {
    private volumeIdCursor = 0
    // Sorted in reverse order
    private volumeAccumulator: ChapterMetadata[] = []
    private titleName: string = ''

    private async closeCookieConsent() {
        try {
            logger.info('Closing cookie consent start')

            const okButton = this.browserPage
                .locator('div', {
                    hasText: cookieConsentContent,
                    has: this.browserPage.locator('button').getByText(cookieConsentOk, { exact: false })
                })
                .getByRole('button', { name: cookieConsentOk, exact: true })
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
        await chapterTab.click({ delay: this.getClickTimePeriod() })
    }

    private async changeSortOrder() {
        const sortOrderButton = await this.browserPage.getByRole('button', { name: sortOrderButtonTitle })
        await sortOrderButton.click({ delay: this.getClickTimePeriod() })
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

    private async getChaptersBatchFrom(volumeId: number, chapterId: number): Promise<ChapterMetadata[]> {
        const prefix = `${volumeTitle} ${volumeId} ${chapterTitle}`
        const chapterElements = await this.browserPage.getByRole('link', { name: prefix }).all()
        const parseRegexp = new RegExp(`${prefix} ([\\d\\.]+)( - (.+))?`)

        const result = await Promise.all(
            chapterElements.map(async (locator) => {
                const link = await locator.getAttribute('href')
                const innerText = await locator.innerText()
                const textParseResult = parseRegexp.exec(innerText)

                if (textParseResult && link) {
                    const [_1, id, _2, title] = textParseResult
                    const parsedId = parseFloat(id)

                    return { 
                        link: `${URL_BASE}${link}`, 
                        id: parsedId, 
                        title, 
                        volumeId,
                        titleName: this.titleName
                    }
                } else {
                    throw new Error('Cannot parse text from chapter title')
                }
            })
        )

        return result.filter(chapter => chapter.id > chapterId)
    }

    private async scrollToText(volumeId: number, chapterId: number) {
        const elementTitle = `${volumeTitle} ${volumeId} ${chapterTitle} ${chapterId}`
        const scrollTarget = await this.browserPage.getByRole('link', { name: new RegExp(`${elementTitle} ?`) })

        const scrollTargetPosition = await scrollTarget.boundingBox()

        if (scrollTargetPosition) {
            const deltaY = Math.max(scrollTargetPosition.y - 100, 100)
            await this.browserPage.mouse.wheel(0, deltaY)
        } else {
            throw Error(`Cannot scroll to element with title ${elementTitle}`)
        }
    }

    private async loadVolumeChapters() {
        let chapterIdCursor = 0
        let batch

        do {
            await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())
            batch = await this.getChaptersBatchFrom(this.volumeIdCursor, chapterIdCursor)

            if (batch.length) {
                this.volumeAccumulator.push(...batch)
                chapterIdCursor = batch[batch.length - 1].id
                await this.scrollToText(this.volumeIdCursor, chapterIdCursor)
            }
        } while (batch.length)

        this.volumeAccumulator.sort((a, b) => b.id - a.id)
        this.volumeIdCursor++
    }

    protected async read() {
        if (!this.volumeAccumulator.length) {
            await this.loadVolumeChapters()
        }

        return this.volumeAccumulator.pop()
    }

    protected async parseTitleName() {
        const titleNode = await this.browserPage.getByRole('heading')
        const title = await titleNode.innerText()

        this.titleName = title
    }

    async initialize() {
        logger.info('Starting reader initialization')

        await this.openPage()
        await this.closeCookieConsent()
        await this.parseTitleName
        await this.initializeChapterList()

        logger.info('Reader initialization complete')
    }

    getStream() {
        const initialize = this.initialize.bind(this)
        const read = this.read.bind(this)

        return new ReadableStream({
            async start() {
                logger.info('Stream start called')

                await initialize()

                logger.info('Stream initialized successfully')
            },

            async pull(controller) {
                try {
                    logger.info('Pulling next page from stream')
                    const buffer = await read()

                    if (buffer) {
                        controller.enqueue(buffer)

                        logger.info('Page enqueued to stream')
                    } else {
                        controller.close()

                        logger.info('Stream closed - no more pages')
                    }
                } catch (error) {
                    logger.error(error, 'Error in stream pull')

                    controller.error(error)
                }
            }
        })
    }
}