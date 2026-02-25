import { ImageArticle } from '../common/chapterPieces/ImageArticle'
import { PdfImageRenderer } from './PdfImageRenderer'

const DEFAULT_WIDTH = 150
const DEFAULT_HEIGHT = 300

describe('PdfImageRenderer', () => {
    const stringToEncode = 'mock image data'
    const mockBuffer = Buffer.from(stringToEncode)
    const mockImageArticle = new ImageArticle(mockBuffer, DEFAULT_WIDTH, DEFAULT_HEIGHT)

    it('should render image with base64 data', () => {
        const renderer = new PdfImageRenderer(mockImageArticle)
        const result = renderer.render()
        
        expect(result).toHaveProperty('image')
        expect(result.image).toMatch(/^data:image\/png;base64,/)

        const base64Data = result.image.split(',')[1]
        const decodedBuffer = Buffer.from(base64Data, 'base64')
        expect(decodedBuffer.toString()).toBe(stringToEncode)
    })

    it('should set size correctly', () => {
        const renderer = new PdfImageRenderer(mockImageArticle)
        
        const result = renderer.render()
        expect(result).toHaveProperty('width', DEFAULT_WIDTH)
        expect(result).toHaveProperty('height', DEFAULT_HEIGHT)
    })

    it('should calculate size when frame width is set', () => {
        const renderer = new PdfImageRenderer(mockImageArticle)
        renderer.withFrameWidth(100)
        
        const result = renderer.render()
        expect(result).toHaveProperty('width', 100)
        expect(result).toHaveProperty('height', 200)
    })

    it('should handle zero frame width correctly', () => {
        const renderer = new PdfImageRenderer(mockImageArticle)
        renderer.withFrameWidth(0)
        
        const result = renderer.render()
        expect(result).toHaveProperty('width', DEFAULT_WIDTH)
        expect(result).toHaveProperty('height', DEFAULT_HEIGHT)
    })

    it('should chain methods correctly', () => {
        const renderer = new PdfImageRenderer(mockImageArticle)
        const result = renderer
            .withFrameWidth(100)
            .render()
        
        expect(result).toHaveProperty('width', 100)
        expect(result).toHaveProperty('height', 200)
    })
})