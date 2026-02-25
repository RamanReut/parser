import { PdfImageRenderer } from './PdfImageRenderer'
import { IRendererFactory } from '../types/renderer'
import { ChapterPiece } from '../common/chapterPieces/chapterPiece'

export class PdfRendererFactory {
    static getRenderer(piece: ChapterPiece) {
        return new PdfImageRenderer(piece)
    }
}
