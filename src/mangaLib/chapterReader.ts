import logger from '../logger'
import { PageReader } from '../common/PageReader'
import { ImageArticle } from '../common/chapterPieces/ImageArticle'

export class MangaLibChapterReader extends PageReader {
    private _pageCount = 0
    private _counter = 1

    private async initializePageCount() {
        try {
            logger.info('Initializing page count')

            await this.browserPage.waitForTimeout(1000)
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
                const buffer = await image.screenshot({ type: 'png', scale: 'css',  })
                await this.nextPage()
                await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

                logger.info(`Page ${this._counter - 1} screenshot taken successfully`)

                return new ImageArticle(buffer, size!.width, size!.height)
            } else {
                logger.info('No more pages to read')
                return undefined
            }
        } catch (error) {
            logger.error(error, 'Error reading page')
            throw error
        }
    }

    async read() {
        const buffer = []

        for (let page = await this.readPage(); page; page = await this.readPage()) {
            if (page) {
                buffer.push(page)
            }
        }

        return buffer
    }
}
