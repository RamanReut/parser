export { Chapter } from './Chapter'

export class Volume {
    constructor(public id: number, public chapters: Chapter[]) {}
}
