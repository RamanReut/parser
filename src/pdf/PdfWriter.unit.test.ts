import { WritableStream } from 'node:stream/web'
import { PdfWriter } from './PdfWriter'
import { ImageArticle } from '../common/chapterPieces/ImageArticle'
import pdfmake from 'pdfmake'
import { ChapterData } from '../common/ChapterData'

const WIDTH = 1500
const MOCK_IMAGE_WIDTH = 100
const MOCK_IMAGE_HEIGHT = 200
const MOCK_BUFFER = Buffer.from('test image buffer')
const MOCK_IMAGE_ARTICLE = new ImageArticle(MOCK_BUFFER, MOCK_IMAGE_WIDTH, MOCK_IMAGE_HEIGHT)
const MOCK_CHAPTER_DATA = {
  metadata: {
    volumeId: 1,
    id: 2,
    title: 'some_title'
  },
  data: [MOCK_IMAGE_ARTICLE]
} as ChapterData
const writeMock = jest.fn()

jest.mock('pdfmake', () => {
  return {
    __esModule: true,
    default: {
      createPdf: jest.fn()
    }
  }
})

describe('PdfWriter', () => {
  let writer: PdfWriter

  beforeEach(() => {
    writer = new PdfWriter('test')
    // @ts-expect-error for testing purposes
    pdfmake.createPdf.mockImplementation(() => ({
      write: writeMock
    }))
    writeMock.mockResolvedValue(undefined)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with a filename', () => {
    expect(writer).toBeDefined()
  })

  it('should return a WritableStream', () => {
    const stream = writer.getStream()
    expect(stream).toBeInstanceOf(WritableStream)
  })

  it('should handle writes through WritableStream', async () => {
    const stream = writer.getStream()
    
    const writerSink = stream.getWriter()
    await writerSink.write(MOCK_CHAPTER_DATA)
    await writerSink.close()
    
    expect(pdfmake.createPdf).toHaveBeenCalled()
  })

  it('should properly flush to PDF file', async () => {
    const stream = writer.getStream()
    const writerSink = stream.getWriter()
    await writerSink.write(MOCK_CHAPTER_DATA)
    await writerSink.close()

    expect(writeMock).toHaveBeenCalledWith('test/1_2_some_title.pdf')
  })

  it('should handle multiple writes through WritableStream', async () => {
    const secondRendererName = 'second renderer'
    const secondImageArticle = new ImageArticle(Buffer.from('second image buffer'), 100, 200)
    const secondChapterData = {
      metadata: {
        id: 4,
        volumeId: 3,
        title: 'second_title'
      },
      data: [secondImageArticle]
    }
    const stream = writer.getStream()
    const writerSink = stream.getWriter()

    await writerSink.write(MOCK_CHAPTER_DATA)
    await writerSink.write(secondChapterData)
    await writerSink.close()

    expect(pdfmake.createPdf).toHaveBeenCalledTimes(2)

    // @ts-expect-error for testing purposes
    const firstDocumentDefinitions = pdfmake.createPdf.mock.calls[0][0]
    expect(firstDocumentDefinitions.content[0]).toEqual({
      image: `data:image/png;base64,${MOCK_BUFFER.toString('base64')}`,
      width: WIDTH,
      height: 3000
    })

    // @ts-expect-error for testing purposes
    const secondDocumentDefinitions = pdfmake.createPdf.mock.calls[1][0]
    expect(secondDocumentDefinitions.content[0]).toEqual({
      image: `data:image/png;base64,${secondImageArticle.image.toString('base64')}`,
      width: WIDTH,
      height: 3000
    })
  })

  it('should use correct page dimensions', async () => {
    const stream = writer.getStream()
    const writerSink = stream.getWriter()
    await writerSink.write(MOCK_CHAPTER_DATA)
    await writerSink.close()

    // @ts-expect-error for testing purposes
    const documentDefinitions = pdfmake.createPdf.mock.lastCall[0]

    expect(documentDefinitions).toHaveProperty('pageSize')
    expect(documentDefinitions.pageSize).toEqual({
      width: WIDTH,
      height: 'auto'
    })
    expect(documentDefinitions).toHaveProperty('pageMargins')
    expect(documentDefinitions.pageMargins).toEqual([0, 0, 0, 0])
  })
})