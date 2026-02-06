import { WritableStream } from 'node:stream/web'
import pdfmake from 'pdfmake'

import { IPdfRenderer } from '../renderers/renderer'

export class Writer {
    private content = new Array<IPdfRenderer>()

    constructor(protected filename: string) {}

    protected async write(content: IPdfRenderer) {
        this.content.push(content)
    }

    protected async flush() {
        const documentDefinitions = {
            content: this.content.map(c => c.render())
        }

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