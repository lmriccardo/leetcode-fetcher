import chalk from "chalk";
import { writeFile } from "fs";

const link = "https://assets.leetcode.com/uploads/2020/10/03/remove_ex1.jpg";
const name = "./test/images/remove_ex1.bin";

const COMMON_MARKERS: {[key: string] : number} = 
{
  SOI_MARKER  : 0xFFD8, // Start Of Image Marker
  APP0_MARKER : 0xFFE0, // Application 0 (JFIF-specific) marker
  DQT_MARKER  : 0xFFDB, // Define Quantization Table Marker
  DHT_MARKER  : 0xFFC4, // Define Huffman Table Marker
  EOI_MARKER  : 0xFFD9 // End Of Image Marker
};

const VectorToString = (values: number[], x_dim: number, line_prefix: string) : string => 
{
  let string_result = '[';
  for (let index = 0; index < values.length; index++) {
    if (index % x_dim == 0 && index > 0) {
      string_result = string_result + `\n${line_prefix}`;
    }

    if (index < values.length - 1) {
      string_result += `${values[index]}, `;
      continue;
    }

    string_result += `${values[index]}`;
  }

  return string_result + ']';
}

interface Decodable {
  decodeSync() : void;           // A synchronous decode method
  decode()     : Promise<void>;  // The decode asynchronous version
}

interface Printable {
  toString() : string;
}

abstract class JPGMarker implements Decodable, Printable {
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

abstract class JPG_TableMarker extends JPGMarker {
  abstract get identifier(): number;
  abstract get destination(): number;
}

/**
 * This abstract class represents an aggregation of generic markers. Some JPEG Markers
 * like DHT or DQT defines, in a single segment, multiple tables each uniquely identified
 * by the destination parameter. That's because, once a table has been defined for a
 * particular destination, it overwrites the previously associated one.
 */
class MarkerAggregator<T extends JPG_TableMarker> implements Printable {
  protected markers: Record<number, T> = {};
  protected size: number = 0;

  private readonly markerConstructor: new (buffer: Uint8Array) => T;

  constructor(markerConstructor: new (buffer: Uint8Array) => T) {
    this.markerConstructor = markerConstructor;
  }

  // Add a number of markers decoded from the input buffer and
  // returns the total number bytes read. 
  addMarker(buffer: Uint8Array) : number {
    const bbuffer = Buffer.from(buffer); // Uses the Buffer class for better reading
    const position = 2; // Starts the reading from its length
    let length = bbuffer.readUInt16BE(position) - 2;

    let current_pos = position + 2;
    let start_buffer = bbuffer.subarray(current_pos);
    while (length > 0) {
      const marker = new this.markerConstructor(start_buffer);
      this.markers[marker.identifier] = marker;
      this.size++;
      length -= marker.markerLength - 4;
      current_pos = current_pos + marker.markerLength - 4;
      start_buffer = bbuffer.subarray(current_pos)
    }
    
    return current_pos;
  }

  public get nofMarkers() : number { return this.size; }
  
  public getMarker(destination: number) : T {
    return this.markers[destination];
  }

  toString(): string {
    const marker_str = Object.values(this.markers).map(
      (value: T) : string => value.toString());

    return marker_str.join('\n');
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
class JPEG_DQTMarker extends JPG_TableMarker {
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
  public get identifier(): number { return this.t_q; }
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
    const spaces = ' '.repeat(25);
    const informations = (
      `|  - Element Precision  : ${precision}\n`                           + 
      `|  - Table Destination  : ${this.t_q}\n`                            +
      `|  - Number of elements : ${this.q_k.length}\n`                     +
      `|  - Elements           : ${VectorToString(this.q_k, 20, '|' + spaces)}`
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
class DQTAggregation extends MarkerAggregator<JPEG_DQTMarker> {
  constructor() { super(JPEG_DQTMarker); }
}

/**
 * This marker segment, named DHT or Define Huffman Tables, defines one or
 * more Huffman tables, each of them associated to a particular destination
 * which would be referenced in the scan header.
 */
class JPEG_DHTMarker extends JPGMarker {
  private t_c  : number     =  0; // Table class (0 = DC or lossless, 1 = AC)
  private t_h  : number     =  0; // Table destination identifier
  private l_i  : number[]   = []; // Number of Huffman codes of length i
  private v_ij : number[][] = []; // Values associated with each Huffman code

  constructor(buffer: Uint8Array) {
    super('DHT - Define Huffman Table', COMMON_MARKERS.DHT_MARKER, buffer);
    this.decodeSync();
  }

  public get destination() : number { return this.t_h; }
  public get identifier() : number { return (this.t_c << 4) + this.t_h; }

  decodeSync(): void {
    let position = 0; // Skips the length bytes
    const tcth = this.buffer.readUInt8(position);
    this.t_c = tcth >> 4;
    this.t_h = tcth & ~(this.t_c << 4);

    // Read the number of Huffman codes for each length
    position++;
    let total_len = 0;
    for (let idx = 0; idx < 16; idx++) {
      this.l_i.push(this.buffer.readUInt8(position++));
      total_len += this.l_i[idx];
    }

    // Read the values associated with each Huffman code
    for (const i_size of this.l_i) {
      const current_codes: number[] = [];
      for (let idx = 0; idx < i_size; idx++) {
        current_codes.push(this.buffer.readUInt8(position++));
      }
      this.v_ij.push(current_codes);
    }
    
    // Set the new total length to the computed one, which is 17 + total_len.
    // The value 17 cames from the 1-byte (Tc + Th) and the 16 1-bytes long
    // number of huffman codes for each possible length. total_len is instead
    // obtained by summing up all values from the L_i vector.
    this.length = 17 + total_len + 4;
  }

  toString(): string {
    const summary = super.toString();

    const table_class_map : {[key: number] : string} =
    {
      0 : 'DC table or lossless table',
      1 : 'AC table'
    };

    const t_class = table_class_map[this.t_c];
    const spaces = ' '.repeat(28);
    const v_spaces = ' '.repeat(32);

    let values_str = '[\n';
    for (const v_i of this.v_ij) {
      values_str += '|' + v_spaces + VectorToString(v_i, 20, '|' + v_spaces) + '\n';
    }

    values_str += '|' + spaces + ']';

    const informations = (
      `|  - Table Class           : ${this.t_c} (${t_class})\n`                      +
      `|  - Table Destination     : ${this.t_h}\n`                                   +
      `|  - Huffman Codes Lengths : ${VectorToString(this.l_i, 20, '|' + spaces)}\n` +
      `|  - Huffman Values        : ${values_str}`
    );

    return summary + '\n' + informations;
  }
}

class DHTAggregation extends MarkerAggregator<JPEG_DHTMarker> {
  constructor() { super(JPEG_DHTMarker); }
}

/**
 * Start of Frame of Generic Type - SOFn
 * 
 * This marker segment specifies the frame header which contains the source image
 * characteristics, the component in the frame, and the sampling factors for each
 * component, and specifies the destination from which the quantized table to be
 * used when each component are retrieved.
 */
class JPEG_SOFnMarker extends JPGMarker {
  static subTypeMap : {[key: number] : string} =
  {
    0   : 'Baseline DCT',
    1   : 'Extended sequential DCT',
    9   : 'Extended sequential DCT',
    5   : 'Differential sequential DCT',
    0xD : 'Differential sequential DCT',
    2   : 'Progressive DCT',
    0xA : 'Progressive DCT',
    6   : 'Differential Progressive DCT',
    0xE : 'Differential Progressive DCT',
    3   : 'Lossless (sequential)',
    0xB : 'Lossless (sequential)',
    7   : 'Differential Lossless (sequential)',
    0xF : 'Differential Lossless (sequential)'
  };

  private type    : string; // The main type of the sof marker (Differential or not)
  private coding  : string; // The coding type (Huffman or arithmetic)
  private subtype : string; // The SOF subtype

  private p   : number = 0; // The sample precision of the components in the frame
  private y   : number = 0; // The maximum number of lines in the source image
  private x   : number = 0; // The maximum number of samples per line in the source image
  private n_f : number = 0; // The number of source image components in the frame
  
  private c_i  : number[] = []; // Unique identifier for each image component in the frame
  private h_i  : number[] = []; // Specifies the horizontal sampling factor
  private v_i  : number[] = []; // Specifies the vertical sampling factor
  private tq_i : number[] = []; // Quantization table destination selector

  constructor(buffer: Uint8Array, code: number) {
    super('SOFn - Start Of Frame', code, buffer);
    this.decodeSync();

    // We need to set the type, coding and subtype
    // Type: Differential (5-7, D-F) or non-differential (all the others)
    const selector = code & ~((code >> 4) << 4);
    const condition1 = (selector >= 0 && selector <= 3);
    const condition2 = (selector >= 5 && selector <= 7);
    const condition4 = (selector >= 0xD && selector <= 0xF);

    this.type = (condition2 || condition4) ? "Differential" : "Non-differential";
    this.coding = (condition1 || condition2) ? "Huffman" : "Arithmetic";
    this.subtype = JPEG_SOFnMarker.subTypeMap[selector];
  }

  decodeSync(): void {
    let position = 4; // Skips the length reading
    this.p = this.buffer.readUInt8(position);
    this.y = this.buffer.readUInt16BE(position + 1);
    this.x = this.buffer.readUInt16BE(position + 3);
    this.n_f = this.buffer.readUInt8(position + 5);
    position = position + 6;

    for (let counter = 0; counter < this.n_f; counter++) {
      this.c_i.push(this.buffer.readUInt8(position));
      const hivi = this.buffer.readUInt8(position + 1);
      this.h_i.push(hivi >> 4);
      this.v_i.push(hivi & ~((hivi >> 4) << 4));
      this.tq_i.push(this.buffer.readUInt8(position + 2));
      position = position + 3;
    }
  }

  toString(): string {
    const summary = super.toString();

    const c_spaces = ' '.repeat(37);
    const c_string = VectorToString(this.c_i, 20, '|' + c_spaces);
    const h_string = VectorToString(this.h_i, 20, '|' + c_spaces);
    const v_string = VectorToString(this.v_i, 20, '|' + c_spaces);
    const tq_string = VectorToString(this.tq_i, 20, '|' + c_spaces);
    
    const informations = (
      `|  - Type                             : ${this.type}\n`    +
      `|  - Coding                           : ${this.coding}\n`  +
      `|  - SubType                          : ${this.subtype}\n` +  
      `|  - Components Sample Precision (P)  : ${this.p}\n`       +
      `|  - Source Image Vertical dim   (Y)  : ${this.y}\n`       + 
      `|  - Source Iamge Horizontal dim (X)  : ${this.x}\n`       + 
      `|  - Number Of (C,H,V,Tq) values (Nf) : ${this.n_f}\n`     + 
      `|  - C Elements                       : ${c_string}\n`     +
      `|  - H Elements                       : ${h_string}\n`     +
      `|  - V Elements                       : ${v_string}\n`     +
      `|  - Tq Elements                      : ${tq_string}`
    );

    return summary + '\n' + informations;
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
  private sof_marker  : JPEG_SOFnMarker | null = null; // The Start Of Frame Marker

  private dqt_markers : DQTAggregation  | null = new DQTAggregation(); // An Aggregation of DQT Markers
  private dht_markers : DHTAggregation  | null = new DHTAggregation(); // An Aggregation of DHT Markers
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

      if (curr_marker === COMMON_MARKERS.DQT_MARKER) {
        const bytesRead = this.dqt_markers!.addMarker(this.buffer.subarray(this.position));
        this.position += bytesRead;
        continue;
      }

      // SOF Marker should starts with 0xFFCx, then we must identifies if the x values
      // is not equal neither to 4 nor to C, which correspond to DHT and DAC tables respectively.
      const partial_marker = curr_marker >> 4;
      const last_values = curr_marker & ~(partial_marker << 4);
      if (partial_marker === 0xFFC && last_values !== 4 && last_values !== 0xC) {
        this.sof_marker = new JPEG_SOFnMarker(this.buffer.subarray(this.position), curr_marker);
        this.position += this.sof_marker.markerLength;
      }

      if (curr_marker === COMMON_MARKERS.DHT_MARKER) {
        const bytesRead = this.dht_markers!.addMarker(this.buffer.subarray(this.position));
        this.position += bytesRead;
        continue;
      }

      if (curr_marker === 0xFFDA) {
        console.log(this.dqt_markers!.toString());
        console.log(this.sof_marker!.toString());
        console.log(this.dht_markers!.toString());
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