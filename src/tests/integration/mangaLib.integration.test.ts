import { scrapeSPA } from '../../index'
import { PDFDocument } from 'pdf-lib'
import fs, { constants } from 'fs/promises'
import path from 'path'
import os from 'os'

const testOutputDir = path.join(os.tmpdir(), 'manga-scraper-test')
const titleName = 'Однажды моя милая Люмин-чан вдруг стала кошкой (Геншиновский удар)'

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
    const defaultOutputDirectory = 'site-test-output'
    const directoryName = path.join(testOutputDir, defaultOutputDirectory)

    describe('PDF generation', () => {
      const extension = '.pdf'
      const testTag = 'pdfGeneration'
      const outputDirectory = path.join(directoryName, testTag)
      const resultDirectory = path.join(outputDirectory, titleName)

      beforeAll(async () => await scrapeSPA(baseUrl, {
        visibleBrowser: false,
        output: outputDirectory
      }))

      it('folder should exist', async () => {
        await expect(async () => await fs.access(resultDirectory, constants.F_OK)).not.toThrow()
      })

      it('the result folder should contain 4 pdf files', async () => {
        const containedFiles = await fs.readdir(resultDirectory, { withFileTypes: true })

        expect(containedFiles).toHaveLength(4)
        expect(containedFiles.every(({ name }) => name.includes(extension))).toBeTruthy()
      })

      it('file should be readable', async () => {
        const files = await fs.readdir(resultDirectory, { withFileTypes: true })
        const fileToCheck = files[0]
        const fileName = path.join(fileToCheck.parentPath, fileToCheck.name)
        const content = await fs.readFile(fileName)

        expect(content.length).toBeGreaterThan(0)
      })

      it('file should contain valid pdf document with some information', async () => {
        const files = await fs.readdir(resultDirectory, { withFileTypes: true })
        const fileToCheck = files[0]
        const fileName = path.join(fileToCheck.parentPath, fileToCheck.name)
        const content = await fs.readFile(fileName)
        const pdfDoc = await PDFDocument.load(content)

        expect(pdfDoc.getPageCount()).toBeGreaterThan(0)
      })

      // skipped by purpose. Should be run just for debugging purpose only
      it.skip('load file to inspect', async () => {
        const filePath = `./output`

        await scrapeSPA(baseUrl, { 
          visibleBrowser: false, 
          output: filePath 
        })

        console.log('hi')
      })
    })
  })

  describe('Error Handling', () => {
    const testTag = 'errorHandling'
    const outputDirectory = path.join(testOutputDir, testTag)
    // const resultDirectory = path.join(outputDirectory, titleName)

    it('should handle network errors gracefully', async () => {
      const url = 'https://httpstat.us/500'
      
      await expect(scrapeSPA(url, { 
        visibleBrowser: false, 
        output: outputDirectory
      })).rejects.toThrow()
    })

    it('should handle invalid URLs gracefully', async () => {
      const url = 'localhost:8080/nonexistent-page.html'
      
      await expect(scrapeSPA(url, { 
        visibleBrowser: false, 
        output: outputDirectory
      })).rejects.toThrow()
    })
  })
})

