import { ContentImage } from 'pdfmake/interfaces'
import { IImageRenderer } from './renderer'

export class PdfImageRenderer implements IImageRenderer<ContentImage> {
    private width: number = 0
    private height: number = 0
    private frameWidth: number = 0

    constructor(private buffer: Buffer) {}

    private calculateSize() {
        let width = this.width
        let height = this.height

        if (this.frameWidth > 0) {
            const ratio = this.width / this.height

            width = this.frameWidth
            height = Math.floor(width / ratio)
        }

        return { width, height }
    }

    withFrameWidth(maxWidth: number) {
        this.frameWidth = maxWidth

        return this
    }

    withSize(width: number, height: number) {
        this.width = width
        this.height = height

        return this
    }


    render(): ContentImage { 
        return {
            image: `data:image/png;base64,${this.buffer.toString('base64')}`,
            ...this.calculateSize()
        }
    }
}
