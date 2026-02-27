import logger from '../logger'
import { PageReader } from '../common/PageReader'
import { ImageArticle } from '../common/chapterPieces/ImageArticle'

export class MangaLibChapterReader extends PageReader {
    private _pageCount = 0
    private _counter = 1

    private async initializePageCount() {
        try {
            logger.info(`Initializing page count for ${this.url}`)

            await this.browserPage.waitForTimeout(1000)
            const pages = this.browserPage.getByRole('main').locator('*[data-page]')
            this._pageCount = await pages.count()

            logger.info(`${this._pageCount} pages found for ${this.url}`)
            logger.info(`Page count initialized successfully for ${this.url}`)
        } catch (error) {
            logger.error(error, `Cannot initialize page count for ${this.url}`)
            throw error
        }
    }

    async initialize() {
        logger.info(`Starting reader initialization for ${this.url}`)

        await this.openPage()
        await this.initializePageCount()

        logger.info(`Reader initialization complete for ${this.url}`)
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
        logger.info(`Moving to next page for ${this.url}. Current counter: ${this._counter}, Total pages: ${this._pageCount}`)

        if (this._counter < this._pageCount) {
            await this.main.press('ArrowRight', { delay: this.getClickTimePeriod() })
            logger.info(`Moved to page ${this._counter} for ${this.url}`)
        } else {
            logger.info(`No more pages to navigate for ${this.url}`)
        }
        this._counter++
    }

    protected async readPage() {
        try {
            logger.info(`Reading page ${this._counter} of ${this._pageCount} for ${this.url}`)
            const image = this.image

            if (image) {
                const size = await image.boundingBox()
                const buffer = await image.screenshot({ type: 'png', scale: 'css',  })
                await this.nextPage()
                await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

                logger.info(`Page ${this._counter - 1} screenshot taken successfully for ${this.url}`)

                return new ImageArticle(buffer, size!.width, size!.height)
            } else {
                logger.info(`No more pages to read for ${this.url}`)
                return undefined
            }
        } catch (error) {
            logger.error(error, `Error reading page for ${this.url}`)
            throw error
        }
    }

    async read() {
        const buffer = []
        const url = this.url

        for (let page = await this.readPage(); page; page = await this.readPage()) {
            if (page) {
                buffer.push(page)
            }
        }

        return buffer
    }
}
