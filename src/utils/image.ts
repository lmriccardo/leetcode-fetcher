import chalk from "chalk";

const COMMON_MARKERS: Record<string, number> = 
{
  "SOI - (Start Of Image)" : 0xFFD8, // Start of the image (first two bytes)
  
}

class JPGMarker {
  private name: string;
  private code: number; 

  constructor(name: string, code: number) {
    this.name = name;
    this.code = code;
  }
};

class JFIFImageDecoder {
  private buffer  : Buffer;      // The buffer of bytes with the image
  private markers : JPGMarker[]; // A number of markers for the JFIF format
  private image   : number[][];  // Will contains the image data
  private ready   : boolean;     // True, whenever image data are ready
  private error   : boolean;     // If the input buffer is invalid is True

  static isValidJFIF(buffer: Buffer): boolean {
    // Check if the input buffer contains a valid JFIF image
    // A JFIF format must starts with a SOI marker (Start of Image)
    // and an APP0 marker (optionally followed by a JFXX APP0)
    const soi_marker = buffer.readUInt16BE(0);
    const appo_marker = buffer.readUInt16BE(2);
    return (soi_marker === 0xFFD8 && appo_marker === 0xFFE0);
  }

  constructor (buffer: ArrayBuffer) {
    this.buffer = Buffer.from(buffer);
    this.markers = [];
    this.image = [];
    this.ready = false;
    this.error = false;
  }

  public get isDataReady() : boolean { return this.ready || this.error; }
  public get isError() : boolean { return this.error; }
  public get imageData() : number[][] { return this.image; }

  async decode() : Promise<void> {
    // First we need to check if the buffer is a valid
    // JFIF encoded JPG image format.
    if (!JFIFImageDecoder.isValidJFIF(this.buffer)) {
      console.error(chalk.redBright("[ERROR] Input buffer does not" +
        " does not contains a valid JFIF Format."));
      
      this.error = true; // Set the error variable to true
      return;
    }

    // Decode the first segments before the actual compressed image data


    this.ready = true; // Set the ready variable to true
  }

};