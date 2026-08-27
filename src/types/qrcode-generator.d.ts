declare module 'qrcode-generator' {
  interface QRCodeInstance {
    addData(data: string): void;
    make(): void;
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
  }

  export default function qrcode(typeNumber: number, errorCorrectionLevel: string): QRCodeInstance;
}
