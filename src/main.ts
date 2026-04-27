import { scrapeSPA } from './index'
import logger from './logger'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

async function main() {
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
      description: 'Output directory path for generated PDFs',
      default: 'output'
    })
    .positional('url', {
      describe: 'URL to scrape',
      type: 'string',
      demandOption: true
    })
    .help()
    .alias('help', 'h')
    .epilog('Example: npm run start -- https://mangalib.me -v -o output/chapters')
    .parse()

  try {
    await scrapeSPA(argv.url, {
      visibleBrowser: argv['visible-browser'],
      output: argv.output
    })
    logger.info(`Scraping completed successfully for ${argv.url}`)
  } catch (error) {
    logger.error({ err: error }, `Scraping failed for ${argv.url}`)
    process.exit(1)
  }
}

main()

