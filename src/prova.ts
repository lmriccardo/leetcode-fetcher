import chalk from "chalk";
import { writeFile } from "fs";

const link = "https://assets.leetcode.com/uploads/2020/10/03/remove_ex1.jpg";
const name = "./test/images/remove_ex1.bin";

const COMMON_MARKERS: Record<number, string> = 
{
  0xFFD8 : "SOI - (Start Of Image)", // Start of the image (first two bytes)
  0xFFE  : "APPx - (Application x)", // Application-specifier (0xFFEy)
}

class JPGMarker {
  private name   : string; // The name of the marker
  private code   : number; // The corresponding code 0xFFxy
  private length : number; // The length of the marker (length + 2)

  constructor(name: string, code: number) {
    this.name = name;
    this.code = code;
    this.length = 0;
  }
};

class JFIFImageDecoder {
  private buffer   : Buffer;      // The buffer of bytes with the image
  private markers  : JPGMarker[]; // A number of markers for the JFIF format
  private image    : number[][];  // Will contains the image data
  private ready    : boolean;     // True, whenever image data are ready
  private error    : boolean;     // If the input buffer is invalid is True
  private position : number;      // The current position inside the buffer

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
    this.position = 0;
  }

  public get isDataReady() : boolean { return this.ready || this.error; }
  public get isError() : boolean { return this.error; }
  public get imageData() : number[][] { return this.image; }

  resetPosition() { this.position = 0; }

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
    const appo_len = this.buffer.readUInt16BE(4) + 2;
    console.log("APP0 length: ", appo_len);

    this.position = appo_len + 4;
    const dqt_size = this.buffer.readUInt16BE(this.position);
    console.log(`DQT-specification size: ${dqt_size}`);

    this.position += 2;
    const lqtq = this.buffer.readUInt8(this.position);
    const lq = lqtq >> 4;
    const tq = lqtq & ~(lq << 4);
    console.log(`Lq = ${lq} - Tq = ${tq}`);

    this.position += 1

    const ntables = Math.floor(dqt_size / (65 + 64 * lqtq))
    console.log(`Number of tables: ${ntables}`);

    // Use the Lq value as an index to select the byte size
    const bytesToRead = [1,2][lq]; // 1 for lq=0, 2 for lq=1    
    let counter = 0;
    for (let byte_pos = 0; byte_pos < dqt_size - 3; byte_pos += bytesToRead) {
      const bytesValue = bytesToRead === 1 ? this.buffer.readUInt8(this.position)
          : this.buffer.readUInt16BE(this.position);

      console.log(`[Position ${this.position}] ${bytesValue.toString(16)}`);
      this.position += bytesToRead;
      counter++;
    }

    console.log(`Read ${counter} bytes`);

    this.ready = true; // Set the ready variable to true
  }

};


const FetchImage = async () => 
{
  const response = await fetch(link);
  if (!response || response.status !== 200 || !response.ok) return;

  // Get the buffer from the response
  const buffer = await response.arrayBuffer();

  // Decode the byte buffer into image datas
  const decoder = new JFIFImageDecoder(buffer);
  await decoder.decode();
}

FetchImage();