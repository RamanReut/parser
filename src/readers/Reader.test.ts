import { ReadableStream } from 'node:stream/web'
import { Reader } from './Reader'

const mockPage = {
    goto: jest.fn(),
    waitForTimeout: jest.fn(),
    getByRole: jest.fn(),
    locator: jest.fn(),
    click: jest.fn(),
    count: jest.fn(),
    screenshot: jest.fn(),
    getByText: jest.fn(),
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
    let reader: Reader

    beforeEach(() => {
        jest.clearAllMocks()
        reader = new Reader('https://example.com', mockBrowser)
        
        mockBrowser.newPage.mockResolvedValue(mockPage)
        mockPage.getByRole.mockReturnValue(mockPage)
        mockPage.locator.mockReturnValue(mockPage)
        mockPage.getByText.mockReturnValue(mockPage)
        mockPage.click.mockResolvedValue(undefined)
    })

    describe('getStream', () => {
        it('should return a ReadableStream', () => {
            const stream = reader.getStream()
            expect(stream).toBeInstanceOf(ReadableStream)
        })

        it('should read pages correctly through the stream', async () => {
            mockPage.screenshot.mockResolvedValue(Buffer.from('test image buffer'))
            mockPage.count.mockResolvedValue(3)

            const stream = reader.getStream()
            const readerStream = stream.getReader()
            
            const firstResult = await readerStream.read()
            expect(firstResult.done).toBe(false)
            expect(firstResult.value).toBeInstanceOf(Buffer)
            
            const secondResult = await readerStream.read()
            expect(secondResult.done).toBe(false)
            expect(secondResult.value).toBeInstanceOf(Buffer)
            
            const thirdResult = await readerStream.read()
            expect(thirdResult.done).toBe(false)
            expect(thirdResult.value).toBeInstanceOf(Buffer)

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