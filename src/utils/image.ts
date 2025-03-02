import chalk from "chalk";

const COMMON_MARKERS: Record<number, string> = 
{
  0xFFD8 : "SOI - (Start Of Image)", // Start of the image (first two bytes)
  0xFFE  : "APPx - (Application x)", // Application-specifier (0xFFEy)
}

interface Decodable {
  decodeSync() : void;           // A synchronous decode method
  decode()     : Promise<void>;  // The decode asynchronous version
}

abstract class JPGMarker implements Decodable {
  protected name   : string; // The name of the marker
  protected code   : number; // The corresponding code 0xFFxy
  protected length : number; // The length of the marker (length + 2)
  protected buffer : Buffer; // The buffer containing the marker

  constructor(name: string, code: number, buffer: Uint8Array) {
    this.name = name;
    this.code = code;
    this.buffer = Buffer.from(buffer);
    this.length = this.buffer.readUInt16BE(2);
  }

  public get markerLength(): number { return this.length; }

  abstract decodeSync(): void; // Decode the marker
  decode() : Promise<void> { throw new Error('JPGMarker:decode:NotImplementedYet') }
  
  toString(): string {
    // Returns a string summarizing the marker values
    const topper = '|' + '-'.repeat(100) + '|\n';
    return topper + `| Marker ${this.name} <${this.code.toString(16)}> ` +
      `${this.length + 2} bytes`;
  }

};

/**
 * The SOI JPEG Marker - Start Of Image (0xFFD8)
 */
class JPEG_SOIMarker extends JPGMarker {
  constructor(buffer: Uint8Array) {super('SOI - Start Of Image', 0xFFD8, buffer);}
  decodeSync(): void {}
  override toString(): string { return super.toString(); }
}

/**
 * The APPn JPG Marker - Application Marker (0xFFEn)
 */
abstract class JPEG_APPnMarker extends JPGMarker {
  constructor(buffer: Uint8Array, code: number) {
    super('APPn - Applicaion Marker', code, buffer);
  }

  abstract decodeSync(): void;
  override toString(): string { return super.toString(); }
}

/**
 * A specific version of the APPn Marker Segment for the JFIF format.
 */
class JPEG_APP0Marker extends JPEG_APPnMarker {
  private identifier  : string; // A zero terminated string uniquely identifying the marker
  private version     : number; // The version (MSB = major, LSB = minor)
  private units       : number; // Units for the X and Y densities.
  private x_density   : number; // Horizontal pixel density
  private y_density   : number; // Vertical pixel density
  private x_thumbnail : number; // Thumbnail horizontal pixel count
  private y_thumbnail : number; // Thumbnail vertical pixel count

  private rgb_n : [number,number,number][]; // Packet (24-bit) RGB values for the thumbnail
 
  constructor(buffer: Uint8Array) { 
    super(buffer, 0xFFE0);

    // Initialize all the values
    this.identifier  = 'JFIF';
    this.version     = 0;
    this.units       = 0;
    this.x_density   = 0;
    this.y_density   = 0;
    this.x_thumbnail = 0;
    this.y_thumbnail = 0;
    this.rgb_n       = [];

    this.decodeSync();
  }
  
  decodeSync(): void {
    this.version = this.buffer.readUInt16BE(9); // Read the version (skips the identifier)
    this.units = this.buffer.readUInt8(11); // Read the units for X and Y
    this.x_density = this.buffer.readUInt16BE(12); // Read the X density
    this.y_density = this.buffer.readUInt16BE(14); // Read the Y density
    this.x_thumbnail = this.buffer.readUInt8(16); // Read the horizontal pixel count
    this.y_thumbnail = this.buffer.readUInt8(17); // Read the vertical pixel count

    // From this point up to the end we need to take the RGB triplets
    for (let byte_idx = 16; byte_idx < this.length; byte_idx += 3) {
      const red_value = this.buffer.readUInt8(byte_idx);
      const green_value = this.buffer.readUInt8(byte_idx + 1);
      const blue_value = this.buffer.readUInt8(byte_idx + 2);
      this.rgb_n.push([red_value, green_value, blue_value]);
    }
  }

  static unitsToString(unit: number) : string {
    return ({
      0 : 'No units - X and Y specify the pixel aspect ratio',
      1 : 'X and Y are dots per inch',
      2 : 'X and Y are dots per cm'
    } as {[key: number]: string})[unit];
  }

  override toString(): string {
    const summary = super.toString(); // Take the base string from the parent class

    // Format the version string with major and minor
    const major_v = this.version >> 8;
    const minor_v = this.version & ~(major_v << 8);
    const informations = (
      `|  - Identifier              : ${this.identifier}\n`                             + 
      `|  - Version                 : v${major_v}.${minor_v}\n`                         +
      `|  - Units                   : ${JPEG_APP0Marker.unitsToString(this.units)}\n`   +
      `|  - X Pixel Density         : ${this.x_density}\n`                              +
      `|  - Y Pixel Density         : ${this.y_density}\n`                              +
      `|  - Thumbnail X pixel count : ${this.x_thumbnail}\n`                            +
      `|  - Thumbnail Y pixel count : ${this.y_thumbnail}\n`
    );

    return summary + '\n' + informations;
  }
}

/**
 * The End Of Image Marker that must be place at the end of the buffer.
 */
class JPEG_EOIMarker extends JPGMarker {
  constructor(buffer: Uint8Array) { super('EOI - End Of Image', 0xFFD9, buffer); }
  decodeSync(): void { }
  override toString(): string { return super.toString(); }
};

/**
 * This marker segment contains the definition of the Quantization Table
 * for a particular destination. Its elements represent the index in the
 * zig-zag ordering of the DCT (Discrete cosine transform) coefficients.
 * 
 * A single marker can contains multiple tables, however it is not required
 * since other tables can be defined elsewhere in the buffer.
 */
class JPEG_DQTMarker extends JPGMarker {
  private p_q: number[];   // Table element precision
  private t_q: number[];   // Table destination identifier
  private q_k: number[]; // Table elements

  constructor(buffer: Uint8Array) {
    super('DQT - Define Quantization Table', 0xFFD9, buffer); 
  }

  decodeSync(): void {

  }
};

class JFIFImageDecoder implements Decodable {
  private buffer   : Buffer;      // The buffer of bytes with the image
  private image    : number[][];  // Will contains the image data
  private ready    : boolean;     // True, whenever image data are ready
  private error    : boolean;     // If the input buffer is invalid is True
  private position : number;      // The current position inside the buffer
  
  // ---------------------- Marker Section ----------------------
  private soi_marker  : JPEG_SOIMarker  | null; // The Start Of Image Marker
  private app0_marker : JPEG_APP0Marker | null; // The Application0 (for JFIF) Marker
  private eoi_marker  : JPEG_EOIMarker  | null; // The End Of Image Marker
  // ------------------------------------------------------------

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
    this.image = [];
    this.ready = false;
    this.error = false;
    this.position = 0;
    this.soi_marker = null;
    this.app0_marker = null;
    this.eoi_marker = null;
  }

  public get isDataReady() : boolean { return this.ready || this.error; }
  public get isError() : boolean { return this.error; }
  public get imageData() : number[][] { return this.image; }

  resetPosition() { this.position = 0; }

  decodeSync(): void {
    // First we need to check if the buffer is a valid
    // JFIF encoded JPG image format.
    if (!JFIFImageDecoder.isValidJFIF(this.buffer)) {
      console.error(chalk.redBright("[ERROR] Input buffer does not" +
        " contains a valid JFIF Format."));
      
      this.error = true; // Set the error variable to true
      return;
    }

    // First we are 100% sure that the first marker will be a SOI marker
    this.soi_marker = new JPEG_SOIMarker(this.buffer.subarray(this.position, this.position + 2));
    this.position += 2; // We need also to update the position
    console.log(this.soi_marker.toString());

    // Then a required APP0 marker segment must be present in the bytes
    // as conformed by the JFIF Reference Document.
    const app0_length = this.buffer.readUInt16BE(this.position + 2);
    this.app0_marker = new JPEG_APP0Marker(this.buffer.subarray(
      this.position, this.position + app0_length + 2));

    this.position += this.app0_marker.markerLength;
    console.log(this.app0_marker.toString());

    // From now on, there is no requirements on which marker is present
    // For this reason, we should loop until the EOI is not reached.
    while (this.eoi_marker === null) {

    }

    this.ready = true; // Set the ready variable to true
  }

  async decode() : Promise<void> {
    this.decodeSync(); // Decode the JFIF Image
  }

};