import { WritableStream } from 'node:stream/web'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import pdfmake from 'pdfmake'

import { ChapterData } from '../common/ChapterData'
import { PdfRendererFactory } from './PdfRendererFactory'
import { ChapterMetadata } from '../common/ChapterMetadata'
import { mkdir } from 'node:fs/promises'

const WIDTH = 1500

export class PdfWriter {
    private outputFolderExist: boolean = false

    constructor(protected outputPath: string) { }

    protected renderChapter(chapter: ChapterData) {
        return chapter.data.map(piece => {
            const renderer = PdfRendererFactory.getRenderer(piece)

            return renderer.withFrameWidth(WIDTH).render()
        })
    }

    protected createDirectoryName(titleName: string) {
        return `${this.outputPath}/${titleName}`
    }

    protected createFileName({ titleName, volumeId, id, title }: ChapterMetadata) {
        return `${this.createDirectoryName(titleName)}/${volumeId}_${id}_${title}.pdf`
    }

    protected async createOutputFolder(titleName: string) {
        if (!this.outputFolderExist) {
            const outputDirectory = this.createDirectoryName(titleName)
            await mkdir(outputDirectory, { recursive: true })
            this.outputFolderExist = true
        }
    }

    protected async write(content: ChapterData) {
        await this.createDirectoryName(content.metadata.titleName)
        const documentDefinitions = {
            content: this.renderChapter(content),
            pageSize: { width: WIDTH, height: 'auto' },
            pageMargins: [0, 0, 0, 0]
        } as TDocumentDefinitions

        await pdfmake.createPdf(documentDefinitions).write(this.createFileName(content.metadata))
    }

    getStream(): WritableStream {
        const write = this.write.bind(this)

        return new WritableStream({
            write
        })
    }
}