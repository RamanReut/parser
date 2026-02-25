import { ChapterMetadata } from './ChapterMetadata'
import { ChapterPiece } from './chapterPieces/chapterPiece'

export type ChapterData = {
    metadata: ChapterMetadata,
    data: ChapterPiece[]
}