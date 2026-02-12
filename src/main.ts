import { scrapeSPA } from './index'
import logger from './logger'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

async function main() {
  try {
    const argv = await yargs(hideBin(process.argv))
      .option('visible-browser', {
        alias: 'v',
        type: 'boolean',
        description: 'Show the browser during scraping',
        default: false
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output file path',
        default: 'output.pdf'
      })
      .positional('url', {
        describe: 'URL to scrape',
        type: 'string',
        demandOption: true
      })
      .help()
      .alias('help', 'h')
      .epilog('Example: npm run start -- https://example.com -v -o result.pdf')
      .parse()

    await scrapeSPA(argv.url, argv['visible-browser'], argv.output)

    logger.info('Scraping completed successfully')
  } catch (error) {
    logger.error(error, 'Scraping failed')
    process.exit(1)
  }
}

main()
