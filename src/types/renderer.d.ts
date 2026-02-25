import { ContentImage } from 'pdfmake/interfaces'

export interface IRenderer<T> {
    render(): T
}

export interface IImageRenderer<T> extends IRenderer<T> {
    withFrameWidth(maxWidth: number): This,
}

export type IPdfImageRenderer = IImageRenderer<ContentImage>

export type IPdfRenderer = IPdfImageRenderer

// Removed factory interface as renderers are now instantiated directly
export type IRendererFactory<TImageRenderer = IPdfImageRenderer> = never

export type IPdfRendererFactory = IRendererFactory<IPdfImageRenderer> 
