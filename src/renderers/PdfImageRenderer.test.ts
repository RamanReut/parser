import { PdfImageRenderer } from './PdfImageRenderer'

describe('PdfImageRenderer', () => {
    const stringToEncode = 'mock image data'
    const mockBuffer = Buffer.from(stringToEncode)

    it('should create a renderer with buffer', () => {
        const renderer = new PdfImageRenderer(mockBuffer)
        expect(renderer).toBeInstanceOf(PdfImageRenderer)
    })

    it('should render image with base64 data', () => {
        const renderer = new PdfImageRenderer(mockBuffer)
        const result = renderer.render()
        
        expect(result).toHaveProperty('image')
        expect(result.image).toMatch(/^data:image\/png;base64,/)

        const base64Data = result.image.split(',')[1]
        const decodedBuffer = Buffer.from(base64Data, 'base64')
        expect(decodedBuffer.toString()).toBe(stringToEncode)
    })

    it('should set size correctly', () => {
        const renderer = new PdfImageRenderer(mockBuffer)
        renderer.withSize(100, 200)
        
        const result = renderer.render()
        expect(result).toHaveProperty('width', 100)
        expect(result).toHaveProperty('height', 200)
    })

    it('should calculate size when frame width is set', () => {
        const renderer = new PdfImageRenderer(mockBuffer)
        renderer.withSize(200, 100)
        renderer.withFrameWidth(100)
        
        const result = renderer.render()
        expect(result).toHaveProperty('width', 100)
        expect(result).toHaveProperty('height', 50)
    })

    it('should handle zero frame width correctly', () => {
        const renderer = new PdfImageRenderer(mockBuffer)
        renderer.withSize(100, 200)
        renderer.withFrameWidth(0)
        
        const result = renderer.render()
        expect(result).toHaveProperty('width', 100)
        expect(result).toHaveProperty('height', 200)
    })

    it('should chain methods correctly', () => {
        const renderer = new PdfImageRenderer(mockBuffer)
        const result = renderer
            .withSize(150, 300)
            .withFrameWidth(100)
            .render()
        
        expect(result).toHaveProperty('width', 100)
        expect(result).toHaveProperty('height', 200)
    })
})