import chalk from "chalk";
import { writeFile } from "fs";

const link = "https://assets.leetcode.com/uploads/2020/10/03/remove_ex1.jpg";
const name = "./test/images/remove_ex1.bin";

const COMMON_MARKERS: {[key: string] : number} = 
{
  SOI_MARKER  : 0xFFD8, // Start Of Image Marker
  APP0_MARKER : 0xFFE0, // Application 0 (JFIF-specific) marker
  DQT_MARKER  : 0xFFDB, // Define Quantization Table Marker
  EOI_MARKER  : 0xFFD9, // End Of Image Marker
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

    // We need to read the length if it is present in the buffer
    if (this.buffer.length >= 4) {
      this.length = this.buffer.readUInt16BE(2) + 2;
    } else {
      this.length = 2;
    }
  }

  public get markerLength(): number { return this.length; }

  abstract decodeSync(): void; // Decode the marker
  decode() : Promise<void> { throw new Error('JPGMarker:decode:NotImplementedYet') }
  
  toString(): string {
    // Returns a string summarizing the marker values
    const topper = '|' + '-'.repeat(100) + '|\n';
    return topper + `| Marker ${this.name} <${this.code.toString(16)}> ` +
      `${this.length} bytes`;
  }

};

/**
 * The SOI JPEG Marker - Start Of Image (0xFFD8)
 */
class JPEG_SOIMarker extends JPGMarker {
  constructor(buffer: Uint8Array) {super('SOI - Start Of Image', COMMON_MARKERS.SOI_MARKER, buffer);}
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
    super(buffer, COMMON_MARKERS.APP0_MARKER);

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
    for (let byte_idx = 18; byte_idx < this.length - 2; byte_idx += 3) {
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
      `|  - Thumbnail Y pixel count : ${this.y_thumbnail}`
    );

    return summary + '\n' + informations;
  }
}

/**
 * The End Of Image Marker that must be place at the end of the buffer.
 */
class JPEG_EOIMarker extends JPGMarker {
  constructor(buffer: Uint8Array) { super('EOI - End Of Image', COMMON_MARKERS.EOI_MARKER, buffer); }
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
  private p_q: number;   // Table element precision
  private t_q: number;   // Table destination identifier
  private q_k: number[]; // Table elements

  constructor(buffer: Uint8Array) {
    super('DQT - Define Quantization Table', COMMON_MARKERS.DQT_MARKER, buffer);
    
    this.p_q = 0;
    this.t_q = 0;
    this.q_k = [];

    this.decodeSync();
  }

  public get destination(): number { return this.t_q; }
  public get table() : number[] { return this.q_k; }

  decodeSync(): void {
    let position = 0;
    const pqtq = this.buffer.readUInt8(position);
    this.p_q = pqtq >> 4;
    this.t_q = pqtq & ~(this.p_q << 4);
    position += 1;
    
    // The Pq parameter specifies how many bytes to read for each
    // element of the table, therefore the precision. 
    const bytesToRead = [1,2][this.p_q];
    const currLen = 64 * bytesToRead;
    for (let counter = 0; counter < currLen; counter += bytesToRead) {
      const byteValue = bytesToRead == 1 ? this.buffer.readUInt8(position)
          : this.buffer.readUInt16BE(position);
      
      position += bytesToRead;
      this.q_k.push(byteValue);
    }

    this.length = currLen + 5;
  }

  toString(): string {
    const summary = super.toString();
    const precision: string = {0 : '8-bits', 1: '16-bits'}[this.p_q]!;
    const informations = (
      `|  - Element Precision  : ${precision}\n` + 
      `|  - Table Destination  : ${this.t_q}\n`  +
      `|  - Number of elements : ${this.q_k.length}\n`
    );

    return summary + '\n' + informations;
  }
};

/**
 * This class aggregates all the DQT marker found so far. Each marker
 * is uniquely idenfitied by its `destination` (t_q parameter). This
 * comes directly from specifications, in particular: 'once a table has
 * been defined for a particular destination, it replaces the previous
 * table stored in that destination and shall be used in the remaining
 * scans of the current image'.
 */
class DQTAggregation {
  private markers : Record<number, JPEG_DQTMarker> = {};
  private size    : number = 0; // The total number of DQT markers'

  public get nofMarkers() : number { return this.size; }

  // Returns the number of bytes read from the buffer
  addDQTMarker(buffer: Uint8Array) : number {
    const bbuffer = Buffer.from(buffer); // Uses the Buffer class for better reading
    const position = 2; // Starts the reading from its length
    let length = bbuffer.readUInt16BE(position) - 2;

    let current_pos = position + 2;
    let start_buffer = bbuffer.subarray(current_pos);
    while (length > 0) {
      const marker = new JPEG_DQTMarker(start_buffer);
      this.markers[marker.destination] = marker;
      this.size++;
      length -= marker.markerLength - 4;
      current_pos = current_pos + marker.markerLength - 4;
      start_buffer = bbuffer.subarray(current_pos)
    }
    
    return current_pos;
  }

  toString() : string {
    const marker_str = Object.values(this.markers).map(
      (value: JPEG_DQTMarker) : string => value.toString());

    return marker_str.join('');
  }
}

class JFIFImageDecoder implements Decodable {
  private buffer   : Buffer;      // The buffer of bytes with the image
  private image    : number[][];  // Will contains the image data
  private ready    : boolean;     // True, whenever image data are ready
  private error    : boolean;     // If the input buffer is invalid is True
  private position : number;      // The current position inside the buffer
  
  // ---------------------- Marker Section ----------------------
  private soi_marker  : JPEG_SOIMarker  | null = null; // The Start Of Image Marker
  private app0_marker : JPEG_APP0Marker | null = null; // The Application0 (for JFIF) Marker
  private eoi_marker  : JPEG_EOIMarker  | null = null; // The End Of Image Marker
  private dqt_markers : DQTAggregation  | null = new DQTAggregation(); // An Aggregation of DQT Markers
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
      const curr_marker = this.buffer.readUInt16BE(this.position);

      switch (curr_marker) {
        case 0xFFDB:
          const bytesRead = this.dqt_markers!.addDQTMarker(this.buffer.subarray(this.position));
          this.position += bytesRead;
          break;
      
        default:
          break;
      }

      if (this.dqt_markers!.nofMarkers > 1) {
        console.log(this.dqt_markers!.toString());
        break;
      }
    }

    this.ready = true; // Set the ready variable to true
  }

  async decode() : Promise<void> {
    this.decodeSync(); // Decode the JFIF Image
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