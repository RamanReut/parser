import { MangaLibChapterReader } from './chapterReader'
import { ImageArticle } from '../common/chapterPieces/ImageArticle'
const WIDTH = 100
const HEIGHT = 200
const MOCK_BUFFER = Buffer.from('test image buffer')
const EXPECTED_IMAGE_ARTICLE = new ImageArticle(MOCK_BUFFER, WIDTH, HEIGHT)

const mockPage = {
    goto: jest.fn(),
    waitForTimeout: jest.fn(),
    getByRole: jest.fn(),
    locator: jest.fn(),
    press: jest.fn(),
    count: jest.fn(),
    screenshot: jest.fn(),
    getByText: jest.fn(),
    setViewportSize: jest.fn(),
    boundingBox: jest.fn()
} as any

const mockBrowser = {
    newPage: jest.fn(),
} as any

jest.mock('../logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}))

describe('Reader', () => {
    let reader: MangaLibChapterReader

    beforeEach(() => {
        jest.clearAllMocks()

        reader = new MangaLibChapterReader('https://example.com', mockBrowser)
        
        mockBrowser.newPage.mockResolvedValue(mockPage)
        mockPage.getByRole.mockReturnValue(mockPage)
        mockPage.locator.mockReturnValue(mockPage)
        mockPage.getByText.mockReturnValue(mockPage)
        mockPage.press.mockResolvedValue(undefined)
        mockPage.screenshot.mockResolvedValue(MOCK_BUFFER)
        mockPage.boundingBox.mockReturnValue({ x: 0, y: 0, width: WIDTH, height: HEIGHT })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('getStream', () => {
        it('should read pages correctly through the stream', async () => {
            mockPage.count.mockResolvedValue(3)

            await reader.initialize()
            const result = await reader.read()

            expect(result).toEqual([EXPECTED_IMAGE_ARTICLE, EXPECTED_IMAGE_ARTICLE, EXPECTED_IMAGE_ARTICLE])
        })

        it('should handle stream errors', async () => {
            mockPage.screenshot.mockRejectedValue(new Error('Screenshot failed'))

            await reader.initialize()
            await expect(async () => await reader.read()).rejects.toThrow('Screenshot failed')
        })
    })
})