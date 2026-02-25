export class ImageArticle {
    constructor(public image: Buffer, public width: number, public height: number ) {}

    get aspect() {
        return this.width / this.height
    }
}
