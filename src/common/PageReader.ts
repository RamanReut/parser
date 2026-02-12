import { Browser, Page } from 'playwright'
import logger from '../logger'

const WIDTH = 4096
const HEIGHT = 2100

export abstract class PageReader {
    private _browserPage?: Page

    protected get browserPage() {
        if (this._browserPage) {
            return this._browserPage
        }

        throw new Error('Page is not initialized')
    }

    protected set browserPage(value: Page) {
        this._browserPage = value
    }

    constructor(protected url: string, protected browser: Browser, protected useWideViewport: boolean = true) { }

    protected async openPage() {
        try {
            logger.info(`Opening page ${this.url}`)

            this.browserPage = await this.browser.newPage()

            if (this.useWideViewport) {
                await this.browserPage.setViewportSize({ width: WIDTH, height: HEIGHT })
            }
            await this.browserPage.goto(this.url)

            logger.info(`Page ${this.url} opened successfully`)
        } catch (error) {
            logger.error(error, `Cannot open page ${this.url}`)
            throw error
        }
    }

    protected getRandomValueBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    protected getSmallPeriodOfTime() {
        return this.getRandomValueBetween(800, 2000)
    }

    protected getClickTimePeriod() {
        return this.getRandomValueBetween(10, 100)
    }
}
