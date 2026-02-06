import { PdfImageRenderer } from './PdfImageRenderer'
import { IRendererFactory } from './renderer'

export class PdfRendererFactory implements IRendererFactory<PdfImageRenderer> {
    image(buffer: Buffer) {
        return new PdfImageRenderer(buffer)
    }
}