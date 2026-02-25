import { WritableStream } from 'node:stream/web'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import pdfmake from 'pdfmake'

import { ChapterData } from '../common/ChapterData'
import { PdfRendererFactory } from './PdfRendererFactory'

const WIDTH = 1500

export class PdfWriter {
    constructor(protected outputPath: string) { }

    protected renderChapter(chapter: ChapterData) {
        return chapter.data.map(piece => {
            const renderer = PdfRendererFactory.getRenderer(piece)

            return renderer.withFrameWidth(WIDTH).render()
        })
    }

    protected async write(content: ChapterData) {
        const { title, id, volumeId } = content.metadata
        const documentDefinitions = {
            content: this.renderChapter(content),
            pageSize: { width: WIDTH, height: 'auto' },
            pageMargins: [0, 0, 0, 0]
        } as TDocumentDefinitions

        await pdfmake.createPdf(documentDefinitions).write(`${this.outputPath}/${volumeId}_${id}_${title}.pdf`)
    }

    getStream(): WritableStream {
        const write = this.write.bind(this)

        return new WritableStream({
            write
        })
    }
}