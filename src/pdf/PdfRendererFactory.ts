import { PdfImageRenderer } from './PdfImageRenderer'
import { IRendererFactory } from '../types/renderer'

export class PdfRendererFactory implements IRendererFactory<PdfImageRenderer> {
    image(buffer: Buffer) {
        return new PdfImageRenderer(buffer)
    }
}