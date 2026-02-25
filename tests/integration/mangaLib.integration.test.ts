import { scrapeSPA } from '../../src/index'
import { PDFDocument } from 'pdf-lib'
import fs, { constants } from 'fs/promises'
import path from 'path'
import os from 'os'

const testOutputDir = path.join(os.tmpdir(), 'manga-scraper-test')

beforeAll(async () => {
  try {
    await fs.rm(testOutputDir, { recursive: true, force: true })
  } catch (error) {
    // Directory doesn't exist, that's fine
  }

  await fs.mkdir(testOutputDir, { recursive: true })

})

afterAll(async () => {

  try {
    await fs.rm(testOutputDir, { recursive: true, force: true })
  } catch (error) {
    // Directory doesn't exist, that's fine
  }
})

describe('Manga Reader Integration Tests', () => {

  describe('Manga Content Generation', () => {
    const baseUrl = 'https://mangalib.me/ru/manga/64302--one-day-my-lovely-ojou-chan-suddenly-became-a-cat-genshin-impact'
    const defaultOutputFileName = 'site-test-output'
    const filenameWithPath = path.join(testOutputDir, `${defaultOutputFileName}`)

    describe('PDF generation', () => {
      const extension = '.pdf'
      const outputPath = `${filenameWithPath}${extension}`

      beforeAll(async () => await scrapeSPA(baseUrl, false, filenameWithPath))

      it('file should exist', async () => {
        await expect(async () => await fs.access(outputPath, constants.F_OK)).not.toThrow()
      })

      it('file should be readable', async () => {
        const content = await fs.readFile(outputPath)
        expect(content.length).toBeGreaterThan(0)
      })

      it('file should contain valid pdf document with some information', async () => {
        const content = await fs.readFile(outputPath)

        const pdfDoc = await PDFDocument.load(content)
        expect(pdfDoc.getPageCount()).toBeGreaterThan(0)
      })

      // skipped by purpose. Should be run just for debugging purpose only
      it.skip('load file to inspect', async () => {
        const filePath = `output/result`

        await scrapeSPA(baseUrl, false, filePath)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const url = 'https://httpstat.us/500'
      const outputPath = path.join(testOutputDir, 'test-error.pdf')
      
      await expect(scrapeSPA(url, false, outputPath)).rejects.toThrow()
    })

    it('should handle invalid URLs gracefully', async () => {
      const url = 'localhost:8080/nonexistent-page.html'
      const outputPath = path.join(testOutputDir, 'test-error-2.pdf')
      
      await expect(scrapeSPA(url, false, outputPath)).rejects.toThrow()
    })
  })
})
