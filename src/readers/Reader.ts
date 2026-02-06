import { ReadableStream } from 'node:stream/web'
import { Browser, Page } from 'playwright'
import logger from '../logger'
import { IRendererFactory } from '../renderers/renderer'

const cookieConsentContent = 'Мы используем файлы cookie, чтобы сайт работал лучше, оставаясь с нами вы соглашаетесь на такое использование'
const cookieConsentOk = 'ОК'

export class Reader<TRendererFactory extends IRendererFactory> {
    private _browserPage?: Page
    private _pageCount = 0
    private _counter = 1

    protected get browserPage() {
        if (this._browserPage) {
            return this._browserPage
        }

        throw new Error('Page is not initialized')
    }

    protected set browserPage(value: Page) {
        this._browserPage = value
    }

    constructor(
        protected url: string,
        protected browser: Browser,
        protected rendererFactory: TRendererFactory
    ) { }

    protected getRandomValueBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    protected getSmallPeriodOfTime() {
        return this.getRandomValueBetween(800, 2000)
    }

    protected getClickTimePeriod() {
        return this.getRandomValueBetween(10, 100)
    }

    private async closeCookieConsent() {
        try {
            logger.info('Closing cookie consent start')

            const okButton = this.browserPage
                .locator('div', {
                    hasText: cookieConsentContent,
                    has: this.browserPage.locator('button').getByText(cookieConsentOk, { exact: false })
                })
                .getByRole('button')
                .getByText(cookieConsentOk)

            await okButton.waitFor()
            await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

            await okButton.click({ delay: this.getClickTimePeriod() })
            logger.info('Cookie consent closed successfully')
        } catch (error) {
            logger.warn(error, 'Cannot close cookie consent')
        }
    }

    private async openPage() {
        try {
            logger.info('Opening page')

            this.browserPage = await this.browser.newPage()
            await this.browserPage.goto(this.url)

            logger.info('Page opened successfully')
        } catch (error) {
            logger.error(error, 'Cannot open page')
            throw error
        }
    }

    private async initializePageCount() {
        try {
            logger.info('Initializing page count')

            const pages = this.browserPage.getByRole('main').locator('*[data-page]')
            this._pageCount = await pages.count()

            logger.info(`${this._pageCount} pages found`)
            logger.info('Page count initialized successfully')
        } catch (error) {
            logger.error(error, 'Cannot initialize page count')
            throw error
        }
    }

    async initialize() {
        logger.info('Starting reader initialization')

        await this.openPage()
        await this.closeCookieConsent()
        await this.initializePageCount()

        logger.info('Reader initialization complete')
    }

    private get main() {
        return this.browserPage.getByRole('main')
    }

    private get image() {
        if (this._counter <= this._pageCount) {
            return this.main.locator(`*[data-page="${this._counter}"]`).getByRole('img')
        }
        return undefined
    }

    private async nextPage() {
        logger.info(`Moving to next page. Current counter: ${this._counter}, Total pages: ${this._pageCount}`)

        if (this._counter < this._pageCount) {
            await this.main.press('ArrowRight', { delay: this.getClickTimePeriod() })
            logger.info(`Moved to page ${this._counter}`)
        } else {
            logger.info('No more pages to navigate')
        }
        this._counter++
    }

    protected async readPage() {
        try {
            logger.info(`Reading page ${this._counter} of ${this._pageCount}`)
            const image = this.image

            if (image) {
                const size = await image.boundingBox()
                const buffer = await image.screenshot({ type: 'png', scale: 'css' })
                await this.nextPage()
                await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

                logger.info(`Page ${this._counter - 1} screenshot taken successfully`)

                return this.rendererFactory.image(buffer).withSize(size?.width, size?.height)
            } else {
                logger.info('No more pages to read')
                return undefined
            }
        } catch (error) {
            logger.error(error, 'Error reading page')
            throw error
        }
    }

    getStream(): ReadableStream {
        const initialize = this.initialize.bind(this)
        const read = this.readPage.bind(this)

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
