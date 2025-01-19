import * as utils from '../utils'
import chalk from 'chalk';

const ascii: {[k: string]: string} = 
{
  hb  : "─", vb  : "│",
  dt  : "┬", ut  : "┴", lt  : "┤", rt  : "├",
  adr : "┌", adl : "┐", aur : "└", aul : "┘",
  cr  : "┼", dhl : "═", dvl : "║", ddr : "╔",
  dur : "╚", dul : "╝", ddl : "╗", dut : "╩",
  ddt : "╦"
};

declare type Padding = {lpad?: number, rpad?: number, upad?: number, dpad?: number};

class RectangleBox {
  private hsize: number = 0;
  private wsize: number;
  private content: string[] = [];
  private contentpad: Padding;
  private title: string = '';
  private titlepos: number = 0;
  private just: number;
  private style: (x: string) => string;

  constructor(wsize: number, just?: number, style?: (x: string) => string) {
    this.wsize = wsize;
    this.just = just ?? 0;
    this.contentpad = {lpad: 1, rpad: 1, upad: 1, dpad: 1};
    this.style = style ?? ((x) => x);
  }

  setTitle(title: string, position?: number) {
    this.title = title;
    this.titlepos = position || 1;
  }

  setPadding(padding?: Padding) {
    this.contentpad.dpad = padding?.dpad ?? 1;
    this.contentpad.lpad = padding?.lpad ?? 1;
    this.contentpad.rpad = padding?.rpad ?? 1;
    this.contentpad.upad = padding?.upad ?? 1;
  }

  setContent(content: string, padding?: Padding) {
    this.setPadding(padding); // Set the padding content
    const s_padding = this.contentpad.rpad! + this.contentpad.lpad!;  
    const nrows = Math.ceil(content.length / (this.wsize - s_padding));
    this.hsize = this.contentpad.upad! + this.contentpad.dpad! + nrows;
    this.content = [content];

    if (nrows > 1) {
      const n_content = [];
      const curr_size = (this.wsize - s_padding);
      const lpadding = ' '.repeat(this.contentpad.lpad!);
      const rpadding = ' '.repeat(this.contentpad.rpad!);

      for (let idx = 0; idx < nrows; idx++) {
        const start = idx * curr_size;
        const stop = (idx + 1) * curr_size;
        const just_row = utils.JustifyString(
          content.slice(start, stop), curr_size, this.just);

        n_content.push(this.style(lpadding + just_row + rpadding));
      }

      this.content = n_content;
    }
  }

  toString(): string {
    const formatBasicLine = (start: string, end: string, sep1: string)
      : string =>
    {
      const middle_content = Array(this.wsize).fill(sep1).join("");
      return `${start}${middle_content}${end}`;
    }

    // Creates the upper and lower lines
    let r_upper = formatBasicLine(ascii.adr, ascii.adl, ascii.hb);
    const r_lower = formatBasicLine(ascii.aur, ascii.aul, ascii.hb);

    // At the upper one we also need to add the box title
    const r_upper_s = r_upper.substring(0, this.titlepos);
    const r_upper_e = r_upper.substring(this.titlepos + this.title.length);
    r_upper = r_upper_s + chalk.bold(chalk.gray(this.title)) + r_upper_e;

    // Upper and down padding 
    const padding_str = formatBasicLine(ascii.vb, ascii.vb, " ");
    const upper_pad = Array(this.contentpad.upad!).fill(padding_str);
    const lower_pad = Array(this.contentpad.dpad!).fill(padding_str);

    const content = this.content.map((x) => `${ascii.vb}${x}${ascii.vb}`);

    return `${r_upper}\n${upper_pad}\n${content.join('\n')}\n${lower_pad}\n${r_lower}`;
  }
};

export default RectangleBox;