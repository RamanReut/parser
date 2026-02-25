import { ContentImage } from 'pdfmake/interfaces'
import { IImageRenderer } from '../types/renderer'
import { ImageArticle } from '../common/chapterPieces/ImageArticle'

export class PdfImageRenderer implements IImageRenderer<ContentImage> {
    private frameWidth: number = 0

    constructor(private image: ImageArticle) { }

    private calculateSize() {
        let width = this.image.width
        let height = this.image.height

        if (this.frameWidth > 0) {
            const ratio = this.image.aspect

            width = this.frameWidth
            height = Math.floor(width / ratio)
        }

        return { width, height }
    }

    withFrameWidth(maxWidth: number) {
        this.frameWidth = maxWidth

        return this
    }

    render(): ContentImage { 
        return {
            image: `data:image/png;base64,${this.image.image.toString('base64')}`,
            ...this.calculateSize()
        }
    }
}
