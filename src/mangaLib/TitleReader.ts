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
            logger.info(`Closing cookie consent start for ${this.url}`)

            const okButton = this.browserPage
                .locator('div', {
                    hasText: cookieConsentContent,
                    has: this.browserPage.locator('button').getByText(cookieConsentOk, { exact: false })
                })
                .getByRole('button', { name: cookieConsentOk, exact: true })
            await okButton.waitFor()
            await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

            await okButton.click({ delay: this.getClickTimePeriod() })

            logger.info(`Cookie consent closed successfully for ${this.url}`)
        } catch (error) {
            logger.warn(error, `Cannot close cookie consent for ${this.url}`)
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
        try {
            logger.info(`Initializing volume ID for ${this.url}`)

            const firstChapter = await this.browserPage.getByText(volumeTitle).first()
            await firstChapter.waitFor()
            const text = (await firstChapter.allInnerTexts())[0]

            const volumeCaptureRegexp = new RegExp(`${volumeTitle} (\\d+) ${chapterTitle}`)
            const volumeId = volumeCaptureRegexp.exec(text)?.[1]

            if (volumeId) {
                this.volumeIdCursor = parseInt(volumeId, 10)

                logger.info(`Volume ID initialized successfully for ${this.url}: ${this.volumeIdCursor}`)
            } else {
                throw Error('Cannot parse volume id')
            }
        } catch (error) {
            logger.error(error, `Cannot initialize volume ID for ${this.url}`)
            throw error
        }
    }

    private async initializeChapterList() {
        logger.info(`Initializing chapter list for ${this.url}`)

        await this.openSectionPage()
        await this.changeSortOrder()
        await this.initializeVolumeId()

        logger.info(`Finish chapter list initialization for ${this.url}`)
    }

    private async getChaptersBatchFrom(volumeId: number, chapterId: number): Promise<ChapterMetadata[]> {
        try {
            logger.info(`Fetching chapters batch from volume ${volumeId}, starting from chapter ${chapterId} for ${this.url}`)

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

            const filteredResult = result.filter(chapter => chapter.id > chapterId)

            logger.info(`Fetched ${filteredResult.length} chapters from batch for ${this.url}`)

            return filteredResult
        } catch (error) {
            logger.error(error, `Cannot get chapters batch for ${this.url}`)
            throw error
        }
    }

    private async scrollToText(volumeId: number, chapterId: number) {
        try {
            logger.info(`Scrolling to text for volume ${volumeId}, chapter ${chapterId} for ${this.url}`)
            const elementTitle = `${volumeTitle} ${volumeId} ${chapterTitle} ${chapterId}`
            const scrollTarget = await this.browserPage.getByRole('link', { name: new RegExp(`${elementTitle} ?`) })

        const scrollTargetPosition = await scrollTarget.boundingBox()

            if (scrollTargetPosition) {
                const deltaY = Math.max(scrollTargetPosition.y - 100, 100)
                await this.browserPage.mouse.wheel(0, deltaY)
                logger.info(`Successfully scrolled to element with title ${elementTitle} for ${this.url}`)
            } else {
                throw Error(`Cannot scroll to element with title ${elementTitle} for ${this.url}`)
            }
        } catch (error) {
            logger.error(error, `Cannot scroll to text for ${this.url}`)
            throw error
        }
    }

    private async loadVolumeChapters() {
        try {
            logger.info(`Loading volume chapters for ${this.url}`)

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

            logger.info(`Volume chapters loaded successfully for ${this.url}. Total chapters: ${this.volumeAccumulator.length}`)
        } catch (error) {
            logger.error(error, `Cannot load volume chapters for ${this.url}`)
            throw error
        }
    }

    protected async read() {
        if (!this.volumeAccumulator.length) {
            await this.loadVolumeChapters()
        }

        return this.volumeAccumulator.pop()
    }

    protected async parseTitleName() {
        try {
            logger.info(`Parsing title name for ${this.url}`)

            const titleNode = await this.browserPage.getByRole('heading')
            const title = await titleNode.innerText()
            this.titleName = title

            logger.info(`Title name parsed successfully for ${this.url}: ${this.titleName}`)
        } catch (error) {
            logger.error(error, `Cannot parse title name for ${this.url}`)
            throw error
        }
    }

    protected async initialize() {
        logger.info(`Starting reader initialization for ${this.url}`)

        await this.openPage()
        await this.closeCookieConsent()
        await this.parseTitleName()
        await this.initializeChapterList()

        logger.info(`Reader initialization complete for ${this.url}`)
    }

    getStream() {
        const url = this.url
        const initialize = this.initialize.bind(this)
        const read = this.read.bind(this)

        return new ReadableStream({
            async start() {
                logger.info(`Stream start called for ${url}`)

                await initialize()

                logger.info(`Stream initialized successfully for ${url}`)
            },

            async pull(controller) {
                try {
                    logger.info(`Pulling next page from stream for ${url}`)
                    const buffer = await read()

                    if (buffer) {
                        controller.enqueue(buffer)

                        logger.info(`Page enqueued to stream for ${url}`)
                    } else {
                        controller.close()

                        logger.info(`Stream closed - no more pages for ${url}`)
                    }
                } catch (error) {
                    logger.error(error, `Error in stream pull for ${url}`)

                    controller.error(error)
                }
            }
        })
    }
}
