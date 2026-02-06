import { ContentImage } from 'pdfmake/interfaces'

export interface IRenderer<T> {
    render(): T
}

export interface IImageRenderer<T> extends IRenderer<T> {
    withSize(width: number, height: number): This
}

export type IPdfImageRenderer = IImageRenderer<ContentImage>

export type IPdfRenderer = IPdfImageRenderer

export interface IRendererFactory<TImageRenderer = IImageRenderer> {
    image(buffer: Buffer): TImageRenderer
}

export type IPdfRendererFactory = IRendererFactory<IPdfImageRenderer> 
