import { ReadableStream } from 'node:stream/web'
import { Browser, Page } from 'playwright'
import logger from '../logger'

const cookieConsentContent = 'Мы используем файлы cookie, чтобы сайт работал лучше, оставаясь с нами вы соглашаетесь на такое использование'
const cookieConsentOk = 'ОК'

export class Reader {
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

    constructor(protected url: string, protected browser: Browser) { }

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

            okButton.click({ delay: this.getClickTimePeriod() })
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

        await this.browserPage.waitForTimeout(100000)
        logger.info('Reader initialization complete')
    }

    private get main() {
        return this.browserPage.getByRole('main')    
    }

    private get image() {
        if (this._counter <= this._pageCount) {
            return this.main.locator(`*[data-page="${this._counter}"`).getByRole('img')
        }
    }

    private async nextPage() {
        const image = this.image

        if (image) {
            if (this._counter < this._pageCount) {
                await image.click()
            }
            this._counter++
        }
    }

    protected async readPage() {
        const image = this.image

        if (image) {
            const buffer = image.screenshot()
            await this.nextPage()

            return buffer
        }

    }

    getStream(): ReadableStream {
        const initialize = this.initialize.bind(this)
        const read = this.readPage.bind(this)

        return new ReadableStream({
            async start() {
                await initialize()
            },

            async pull(streamController) {
                const buffer = await read()

                if (buffer) {
                    streamController.enqueue()
                } else {
                    streamController.close()
                }
            }
        })
    }
}


