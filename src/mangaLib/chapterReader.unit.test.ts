import { ReadableStream } from 'node:stream/web'
import { MangaLibChapterReader } from './chapterReader'
import { IPdfRendererFactory } from '../types/renderer'

const IMAGE_WIDTH = 100
const IMAGE_HEIGHT = 200
const MOCK_BUFFER = Buffer.from('test image buffer')
const EXPECTED_CONTENT_IMAGE: any = {
    buffer: MOCK_BUFFER,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT
}

class MockRenderer {
    width: number = 0
    height: number = 0

    constructor(public buffer: Buffer) { }

    withSize(width: number, height: number) {
        this.width = width
        this.height = height

        return this
    }
}

const mockRendererFactory = {
    image: jest.fn()
}

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
    let reader: MangaLibChapterReader<IPdfRendererFactory>

    beforeEach(() => {
        jest.clearAllMocks()

        mockRendererFactory.image.mockImplementation((buffer: Buffer) => new MockRenderer(buffer))

        reader = new MangaLibChapterReader('https://example.com', mockBrowser, mockRendererFactory)
        
        mockBrowser.newPage.mockResolvedValue(mockPage)
        mockPage.getByRole.mockReturnValue(mockPage)
        mockPage.locator.mockReturnValue(mockPage)
        mockPage.getByText.mockReturnValue(mockPage)
        mockPage.press.mockResolvedValue(undefined)
        mockPage.screenshot.mockResolvedValue(MOCK_BUFFER)
        mockPage.boundingBox.mockReturnValue({ x: 0, y: 0, width: IMAGE_WIDTH, height: IMAGE_HEIGHT })
    })

    afterEach(() => {
        mockRendererFactory.image.mockClear()
        mockPage.screenshot.mockClear()
    })

    describe('getStream', () => {
        it('should return a ReadableStream', () => {
            const stream = reader.getStream()
            expect(stream).toBeInstanceOf(ReadableStream)
        })

        it('should read pages correctly through the stream', async () => {
            mockPage.count.mockResolvedValue(3)

            const stream = reader.getStream()
            const readerStream = stream.getReader()
            
            const firstResult = await readerStream.read()
            expect(firstResult.done).toBe(false)
            expect(firstResult.value).toEqual(EXPECTED_CONTENT_IMAGE)
            
            const secondResult = await readerStream.read()
            expect(secondResult.done).toBe(false)
            expect(secondResult.value).toEqual(EXPECTED_CONTENT_IMAGE)
            
            const thirdResult = await readerStream.read()
            expect(thirdResult.done).toBe(false)
            expect(thirdResult.value).toEqual(EXPECTED_CONTENT_IMAGE)

            const fourthResult = await readerStream.read()
            expect(fourthResult.done).toBe(true)
            expect(fourthResult.value).toEqual(undefined)
            
            await readerStream.releaseLock()
        })

        it('should handle stream errors', async () => {
            const stream = reader.getStream()
            const readerStream = stream.getReader()
            
            await readerStream.read()
            mockPage.screenshot.mockRejectedValue(new Error('Screenshot failed'))

            await expect(readerStream.read()).rejects.toThrow('Screenshot failed')
        })
    })
})