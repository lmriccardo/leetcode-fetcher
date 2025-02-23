import Printable from "./printer";
import chalk from "chalk";

const superscripts: { [key: string]: string } = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
};

const htmlEntities: Record<string, string> = {
  "nbsp"   : "\u00A0",  // Non-breaking space
  "lt"     : "<",       // Less than
  "gt"     : ">",       // Greater than
  "amp"    : "&",       // Ampersand
  "quot"   : "\"",      // Double quote
  "apos"   : "'",       // Single quote
  "copy"   : "©",       // Copyright symbol
  "reg"    : "®",       // Registered trademark
  "trade"  : "™",       // Trademark symbol
  "cent"   : "¢",       // Cent sign
  "pound"  : "£",       // British pound
  "yen"    : "¥",       // Yen sign
  "euro"   : "€",       // Euro sign
  "sect"   : "§",       // Section sign
  "deg"    : "°",       // Degree symbol
  "plusmn" : "±",       // Plus-minus sign
  "times"  : "×",       // Multiplication sign
  "divide" : "÷",       // Division sign
  "bull"   : "•",       // Bullet
  "hellip" : "…",       // Horizontal ellipsis
  "prime"  : "′",       // Prime (minutes)
  "Prime"  : "″",       // Double prime (seconds)
  "brvbar" : "¦",       // Broken bar
  "mdash"  : "—",       // Em dash
  "ndash"  : "–",       // En dash
  "#39"    : "'"        // The single quote
};

class HTMLTag extends Printable implements Iterable<HTMLTag> {
  protected name        : string;    // The name of the tag
  protected size        : number;    // The size of the opening tag
  protected children    : HTMLTag[]; // A list of all other tag inside this one
  protected self_closed : boolean;   // If a tag is self closed or not
  protected n_children  : number;    // The total number of children
  protected start_pos   : number;    // The position where the tag starts
  protected end_pos     : number;    // The position where the tag stops
  protected content     : string;    // The inner content of the tag

  constructor(tag_name: string, size: number, x1: number, 
    x2?: number, self_closed?: boolean
  ) {
    super();
    this.name = tag_name;
    this.size = size;
    this.children = [];
    this.self_closed = self_closed ?? false;
    this.n_children = 0;
    this.start_pos = x1;
    this.end_pos = x2 ?? 0;
    this.content = "";
  }
  
  // GETTER METHODS
  public get tagName() : string { return this.name; }
  public get startPos() : number { return this.start_pos; }
  public get endPos() : number { return this.end_pos; }
  public get innerHTML(): string { return this.content; }
  public get contentPos() : [number, number] { 
    return [this.start_pos + this.size, this.end_pos - (this.name.length + 3)] 
  }

  // SETTER METHODS
  public set endPos(value: number) { this.end_pos = value; }
  public set innerHTML(content: string) { this.content = content; }

  *[Symbol.iterator]() {
    for (const child of this.children) {
      yield child;
    }
  }

  addChild(tag: HTMLTag) {
    this.children.push(tag);
    this.n_children++;
  }

  toString() : string {
    let result = this.content;
    const [root_s, _] = this.contentPos;
    let backdel_c = 0;

    for (const child of this.children) {
      const [s, e] = [child.startPos, child.endPos];
      const child_content = result.slice(s - root_s - backdel_c, 
        e - root_s - backdel_c);
      
      result = result.replace(child_content, child.toString());
      backdel_c = this.content.length - result.length;
    }

    // Replace all entities with the corresponding value
    for (const entity of Object.keys(htmlEntities)) {
      result = result.replaceAll(`&${entity};`, htmlEntities[entity]);
    }

    return result.replace('\t', ' ');
  }
  
};

class HTMLEmphasisTag extends HTMLTag {
  override toString(): string { return chalk.italic(super.toString()); }
}

class HTMLStrongTag extends HTMLTag {
  override toString(): string { return chalk.bold(super.toString()); }
}

class HTMLCodeTag extends HTMLTag {
  override toString(): string { 
    return chalk.bgGray(chalk.whiteBright(super.toString()));
  }
}

class HTMLPreTag extends HTMLTag {
  override toString(): string { 
    const previous_result = super.toString();
    const left_block = "▌";
    let final_result = [];

    for (const line of previous_result.split('\n')) {
      if (line.length < 1) continue;
      final_result.push(`${left_block} ${line}`);
    }

    return final_result.join('\n');
  }
}

class HTMLSupTag extends HTMLTag {
  override toString(): string {
    const symbols = super.toString().split('').map((x) => superscripts[x]);
    return symbols.join('');
  }
}

class HTMLListItemTag extends HTMLTag {
  override toString(): string {
    return `● ${super.toString()}`
  }
}

const tagmapping: Record<string, typeof HTMLTag> = 
{
  "em"   : HTMLEmphasisTag, "strong" : HTMLStrongTag,
  "code" : HTMLCodeTag,     "pre"    : HTMLPreTag,
  "sup"  : HTMLSupTag,      "li"     : HTMLListItemTag,
  "div"  : HTMLPreTag
};

/**
 * This HTMLDocumentPrinter is a class used to better print a string
 * containing HTML-like content. This is used when showing problems
 * description.
 */
class HTMLDocumentPrinter extends Printable {
  private text     : string;  // The content of the document
  private root_tag : HTMLTag; // The root html tag

  // The pattern to recognize opening and closing tags
  static pattern: RegExp = /<(\w+)(?:\s+(.+?=.*?))*[\/]?>|<\/(\w+)>/gm;

  constructor(doc_in: string) {
    super();
    this.text = doc_in;
    this.root_tag = new HTMLTag("content", 0, 0, this.text.length, false);
    this.root_tag.innerHTML = this.text;
  }

  public parseDocument() : boolean {
    let stack: HTMLTag[] = [this.root_tag];

    for (const match of [...this.text.matchAll(HTMLDocumentPrinter.pattern)]) {
      if (match[0].endsWith('/>')) {
        console.log(match[0]);
        continue;
      }

      // If it is a closure tag then we need to create a new tag
      if (match[0].startsWith('</')) {
        const closed_tag = stack.pop()!;

        // Check that the closed tag match the current one
        if (closed_tag.tagName !== match[3]) return false;

        closed_tag.endPos = match.index + match[0].length;
        closed_tag.innerHTML = this.text.substring(...closed_tag.contentPos);
        stack.at(-1)!.addChild(closed_tag);

        continue;
      }

      // Otherwise, push the required information: name and position
      const TagClass = tagmapping[match[1]] ?? HTMLTag;
      stack.push(new TagClass(match[1], match[0].length, match.index!));
    }

    return true;
  }

  toString(): string {
    if (!this.parseDocument()) {
      console.error(chalk.redBright("[ERROR] HTML Document bad formatting."));
      return "";
    }

    return this.root_tag.toString();
  }
};

export default HTMLDocumentPrinter;