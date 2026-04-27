import { PageReader } from '../common/PageReader'
import logger from '../logger'

const cookieConsentContent = 'Мы используем файлы cookie, чтобы сайт работал лучше, оставаясь с нами вы соглашаетесь на такое использование'
const cookieConsentOk = 'ОК'

export class MangaLibPageReader extends PageReader {
    protected async closeCookieConsent() {
        try {
            logger.info(`Closing cookie consent start for ${this.url}`)

            const okButton = this.browserPage.locator('div', {
                    hasText: cookieConsentContent,
                    has: this.browserPage.locator('button').getByText(cookieConsentOk, { exact: false })
            }).getByRole('button', { name: cookieConsentOk, exact: true })
            await okButton.waitFor()
            await this.browserPage.waitForTimeout(this.getSmallPeriodOfTime())

            await okButton.click({ delay: this.getClickTimePeriod() })

            logger.info(`Cookie consent closed successfully for ${this.url}`)
        } catch (error) {
            logger.warn(error, `Cannot close cookie consent for ${this.url}`)
            throw error
        }
    }
}
