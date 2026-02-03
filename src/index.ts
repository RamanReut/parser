import { chromium } from 'playwright'
import { Reader } from './readers/Reader'
import { Logger } from 'pino'

async function scrapeSPA(url: string): Promise<void> {
  console.log(`Starting scrape of ${url}`)
  
  const browser = await chromium.launch({ 
    headless: false,
    chromiumSandbox: true
  })

  
    
  try {
    const reader = new Reader(url, browser)
    await reader.initialize()
    
    // Example: Extract title and content

    // You can add more specific scraping logic here
    // For example:
    // const data = await page.evaluate(() => {
    //   return Array.from(document.querySelectorAll('.item'))
    //     .map(el => el.textContent)
    // });
    
    console.log('Scraping completed successfully')
  } catch (error) {
    console.error('Error during scraping:', error)
  } finally {
    await browser.close()
  }
}

// Example usage
async function main() {
  await scrapeSPA('https://mangalib.me/ru/6435--kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen/read/v3/c23')
}

// Run the script
main().catch(console.error)