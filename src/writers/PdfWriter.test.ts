import { WritableStream } from 'node:stream/web'
import { PdfWriter } from './PdfWriter'
import { IPdfRenderer } from '../renderers/renderer'
import pdfmake from 'pdfmake'

const writeMock = jest.fn()

jest.mock('pdfmake', () => {
  return {
    __esModule: true,
    default: {
      createPdf: jest.fn()
    }
  }
})

class MockRenderer implements IPdfRenderer {
  frameWidth: number = 0

  constructor(private value: string) {}

  withFrameWidth(width: number) {
    this.frameWidth = width

    return this
  }

  withSize(width: number, height: number) {
    return this
  }

  render(): any {
    return { 
      value: this.value,
      frameWidth: this.frameWidth
    }
  }
}

describe('PdfWriter', () => {
  let writer: PdfWriter
  let mockRenderer: MockRenderer

  beforeEach(() => {
    writer = new PdfWriter('test')
    mockRenderer = new MockRenderer('')
    // @ts-expect-error for testing purposes
    pdfmake.createPdf.mockImplementation(() => ({
      write: writeMock
    }))
    writeMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with a filename', () => {
    expect(writer).toBeDefined()
  })

  it('should handle writes through WritableStream', async () => {
    const stream = writer.getStream()
    
    const writerSink = stream.getWriter()
    await writerSink.write(mockRenderer)
    await writerSink.close()
    
    expect(pdfmake.createPdf).toHaveBeenCalled()
  })

  it('should return a WritableStream', () => {
    const stream = writer.getStream()
    expect(stream).toBeInstanceOf(WritableStream)
  })

  it('should handle multiple writes through WritableStream', async () => {
    const firstRendererName = 'first renderer'
    const secondRendererName = 'second renderer'

    const firstRenderer = new MockRenderer(firstRendererName)
    const secondRenderer = new MockRenderer(secondRendererName)
    const stream = writer.getStream()
    const writerSink = stream.getWriter()

    await writerSink.write(firstRenderer)
    await writerSink.write(secondRenderer)
    await writerSink.close()

    expect(pdfmake.createPdf).toHaveBeenCalled()

    // @ts-expect-error for testing purposes
    const documentDefinitions = pdfmake.createPdf.mock.lastCall[0]

    expect(documentDefinitions.content).toEqual([{
      value: firstRendererName,
      frameWidth: 1500
    }, {
      value: secondRendererName,
      frameWidth: 1500
    }])
  })

  it('should properly flush to PDF file', async () => {
    const stream = writer.getStream()
    const writerSink = stream.getWriter()
    await writerSink.write(mockRenderer)
    await writerSink.close()

    expect(writeMock).toHaveBeenCalledWith('test.pdf')
  })
})