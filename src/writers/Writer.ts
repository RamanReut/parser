import { WritableStream } from 'node:stream/web'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import pdfmake from 'pdfmake'

import { IPdfRenderer } from '../renderers/renderer'

const WIDTH = 1500

export class Writer {
    private content = new Array<IPdfRenderer>()

    constructor(protected filename: string) {}

    protected async write(content: IPdfRenderer) {
        this.content.push(content)
    }

    protected async flush() {
        const documentDefinitions = {
            content: this.content.map(c => c.withFrameWidth(WIDTH).render()),
            pageSize: { width: WIDTH, height: 'auto' },
            pageMargins: [0, 0, 0, 0]
        } as TDocumentDefinitions

        await pdfmake.createPdf(documentDefinitions).write(`${this.filename}.pdf`)
    }

    getStream(): WritableStream {
        const write = this.write.bind(this)
        const close = this.flush.bind(this)

        return new WritableStream({
            write,
            close
        })
    }
}