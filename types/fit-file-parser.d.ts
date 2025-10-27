declare module "fit-file-parser" {
  export interface FitParserOptions {
    force?: boolean;
    speedUnit?: "m/s" | "km/h" | "mph";
    elapsedRecordField?: boolean;
    mode?: "list" | "cascade";
  }

  export default class FitParser {
    constructor(options?: FitParserOptions);
    parse(data: ArrayBuffer | Buffer, callback: (error: Error | null, data: any) => void): void;
  }
}
