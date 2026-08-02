declare module "jsbarcode" {
  interface JsBarcodeOptions {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    font?: string;
    fontOptions?: string;
    textMargin?: number;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    background?: string;
    lineColor?: string;
    flat?: boolean;
    text?: string;
  }
  export default function JsBarcode(
    element: HTMLElement | HTMLCanvasElement | SVGElement | string,
    value: string,
    options?: JsBarcodeOptions
  ): void;
}
