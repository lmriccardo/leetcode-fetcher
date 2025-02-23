import chalk from "chalk";
import Printable from "./printer";
import * as generic from '../utils/general'
import * as formatter from '../utils/formatter'


const ascii: {[k: string]: string} = 
{
  hb  : "─", vb  : "│",
  dt  : "┬", ut  : "┴", lt  : "┤", rt  : "├",
  adr : "┌", adl : "┐", aur : "└", aul : "┘",
  cr  : "┼", dhl : "═", dvl : "║", ddr : "╔",
  dur : "╚", dul : "╝", ddl : "╗", dut : "╩",
  ddt : "╦"
};

declare type ColumnProperties = {size: number, style?: (x: string) => string, just?: number};

function getVisibleTextLength(input: string) {
  // Regular expression to remove ANSI escape sequences
  const strippedText = input.replace(/\x1b\]8;;.*?\x1b\\|\x1b\]8;;\x1b\\/g, '');
  return strippedText.length;
}

class TablePrinter extends Printable {
  private ncols: number = 0;
  private nrows: number = 0;
  private columns: string[] = [];
  private cprops: ColumnProperties[] = [];
  private padding: number[] = [2, 3, 2];
  private rows: (string|number)[][] = [];
  private rowsizes: number[] = [];
  private title: string;
  private showLines: boolean = true;
  private header: boolean = true;
  private show_title: boolean = true;

  constructor(title?: string, cols?: string[], props?: ColumnProperties[]) {
    super();
    
    // If both columns and props are given check that the dimensions matches.
    if (cols !== undefined && props !== undefined) {
      if (cols.length !== props.length) {
        console.error(chalk.redBright("Not enough properties or columns"));
        throw new Error("Error");
      }
    }

    // If only columns are defined or in general the columns parameter
    // is not undefined than we can set the columns and a number of 
    // default properties.
    if (cols !== undefined) {
      this.columns = cols;
      this.ncols = cols.length;
      this.cprops = Array(this.ncols).fill({size: 20, just: 0});
    }

    // If also or only properties are defined, then we can set the 
    // properties. We have already check the two dimensions matches
    // and we can set the values correspondly.
    if (props !== undefined) {
      this.cprops = this.cprops = props.map((x) : ColumnProperties => (
        {
          size: x.size,
          style: x.style || ((x: string) => x),
          just: x.just || 0
        }
      ));

      this.ncols = this.cprops.length;

      // If columns are undefined or empty then set the show columsn to false
      if ((!cols) || (cols.length == 0)) {
        this.header = false;
      }
    }

    this.title = title ?? "";
    this.showTitle = (title !== undefined || title !== null);
  }

  private getContentSize(content: string|number) : number {
    return (typeof content == "string") ? getVisibleTextLength(content) 
      : getVisibleTextLength(content.toString())
  }

  private getRowVerticalSize(content: (string|number)[]) : number {
    const rows_vsize = content.map((x, idx) : number => {
      const x_size = this.getContentSize(x);
      return Math.ceil(x_size / this.cprops[idx].size);
    });

    return Math.max(...rows_vsize, 1);
  }

  private checkContentLen = (clen: number) : boolean => {
    if (clen !== this.ncols) {
      console.error(chalk.redBright(`Input content has `
          + `${clen} columns instead of ${this.ncols}.`));
      
      return false;
    }

    return true;
  }

  private valueToString(x: string | number) : string {
    return (typeof x == 'string') ? x : x.toString();
  }

  private getContent(content: string, idx: number, header?: boolean) : string {
    const properties = this.cprops[idx];
    const style = (header) ? (x: string) => chalk.bold(x.toUpperCase()) : properties.style!;
    const content_just = (header) ? 0 : properties.just!;
    return style(formatter.JustifyString(content, properties.size, content_just));
  }

  private line(x: string): string {
    return (this.showLines) ? x : '';
  }

  private contentToString(content: (string | number)[], header?: boolean) : string {
    const c = content.map((y, idx) : string => this.getContent(
      this.valueToString(y), idx, header)).join(` ${this.line(ascii.vb)} `);

    const s = (this.showLine) ? ' ' : '';
    return `${this.line(ascii.vb)}${s}${c}${s}${this.line(ascii.vb)}`;
  }

  private rowToString(row_idx: number, vsize: number) : string {
    const rows = this.rows.slice(row_idx, row_idx + vsize);
    return rows.map((x): string => this.contentToString(x)).join("\n");
  }

  addColumn(name: string, prop: ColumnProperties) {
    this.columns.push(name);
    this.cprops.push({
      size: prop.size,
      style: prop.style || ((x: string) => x),
      just: prop.just || 0
    });

    this.ncols++;
  }

  pushRow(...content: (string|number)[]) {
    if (!this.checkContentLen(content.length)) return;

    const vsize = this.getRowVerticalSize(content);
    this.rowsizes.push(vsize);

    if (vsize < 2) {
      this.rows.push(content);
      this.nrows += vsize;
      return;
    }

    // If the vertical size if > 1 we need to split the row
    const rows = content.map((x, idx) : string[] => {
      const size = this.getContentSize(x);
      const colsize = this.cprops[idx].size;
      const x_str = this.valueToString(x);

      // If the current content size is less than the column size
      // we can just returns the content and then a number of spaces
      if (size < colsize) {
        return [x_str, ...Array(vsize-1).fill(" ")]
      }

      // Otherwise we need to cut the content
      return Array.from({length: vsize}, (_, i) => i).map((i) : string => {
        const start_idx = i * colsize;
        if (start_idx > size) return " ";

        const stop_idx = Math.min((i + 1) * colsize, size);
        return x_str.slice(start_idx, stop_idx);
      })
    });

    this.rows = [...this.rows, ...generic.Transpose(rows)];
    this.nrows += vsize;
  }

  getWidth() : number {
    const sizes = this.cprops.map((x) => x.size);
    return generic.ArraySum(...sizes) + 2 * this.padding[0] 
      + this.padding[1] * (this.ncols - 1);
  }

  get showLine(): boolean {
    return this.showLines;
  }

  set showLine(value: boolean) {
    this.showLines = value;
  }

  get showHeader(): boolean {
    return this.header;
  }

  set showHeader(value: boolean) {
    this.header = value;
  }

  get showTitle(): boolean {
    return this.show_title;
  }

  set showTitle(value: boolean) {
    this.show_title = value;
  }

  private getColumnSize(col_idx: number): number {
    const column = generic.Transpose(this.rows)[col_idx];
    return Math.max(...column.map((x) => this.getContentSize(x)));
  }

  private fitColumnSize() {
    let total_size = 1 + this.padding[1]*(this.ncols - 1);
    for (let i = 0; i < this.ncols; i++) {
      const actual_size = this.getColumnSize(i);
      this.cprops[i].size = Math.min(actual_size, this.cprops[i].size);

      if (this.columns[i] !== undefined) {
        this.cprops[i].size = Math.max(this.cprops[i].size, this.columns[i].length);
      }

      total_size += this.cprops[i].size;
    }

    // Check if the total size is grater then the current terminal window size
    const [terminal_w, _] = process.stdout.getWindowSize();
    if (total_size > terminal_w) {
      console.warn(chalk.yellowBright(`[WARNING] Total table width is grater then ` +
          `current terminal window size (${total_size} > ${terminal_w}).`
      ));
    }
  }

  toString() : string {
    // Before transforming the table into a string we need to re-fit the columns
    this.fitColumnSize();

    const formatBasicLine = (start: string, end: string, sep1: string, sep2: string)
      : string =>
    {
      const middle_content = this.cprops.map((x): string =>
        Array(x.size + this.padding[0]).fill(this.line(sep1)).join(""))
        .join(this.line(sep2));

      return `${this.line(start)}${middle_content}${this.line(end)}`;
    }

    // Let's construct the first basic lines of ascii characters
    const t_upper = formatBasicLine(ascii.adr, ascii.adl, ascii.hb, ascii.dt);
    const t_middle = formatBasicLine(ascii.rt, ascii.lt, ascii.hb, ascii.cr);
    const t_lower = formatBasicLine(ascii.aur, ascii.aul, ascii.hb, ascii.ut);

    let formatted_rows = [];
    let current_row_idx = 0;
    for (const vsize of this.rowsizes) {
      formatted_rows.push(this.rowToString(current_row_idx, vsize));
      current_row_idx += vsize;
    }

    const middle_del = (this.showLine) ? `\n${t_middle}\n` : '\n'; 
    const content = formatted_rows.join(middle_del);
    const header  = this.contentToString(this.columns, true);

    let title_str = "";
    if (this.title.length > 0) {
      const table_size = this.getWidth();
      const title = formatter.JustifyString(this.title, table_size, 0);
      title_str = `${chalk.bold(title)}\n`;
    }

    // Formats the table
    const prefix = (this.header) ? `${t_upper}\n${header}\n${t_middle}` : `${t_upper}`;
    const table = `${(this.show_title) ? title_str : ''}${prefix}\n${content}\n${t_lower}`

    return table;
  }
};

export default TablePrinter;