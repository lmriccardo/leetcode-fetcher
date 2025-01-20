import constants from '../constants'
import chalk from 'chalk';

class Spinner {
  private interval_id?: NodeJS.Timeout;
  private counter: number;
  private message: string;

  constructor(message: string) {
    this.counter = 0;
    this.message = message;
  }

  start() {
    if (this.interval_id !== undefined) {
      return;
    }

    const interval = constants.SPINNER.DOTS.INTERVAL;
    const frames = constants.SPINNER.DOTS.FRAMES;

    this.interval_id = setInterval(() => {
      process.stdout.write(chalk.cyanBright(`${frames[this.counter]}`) 
        + chalk.bold(chalk.gray(` ${this.message}`)) + '\r');

      this.counter = (this.counter + 1) % frames.length;
    }, interval);
  }

  stop() {
    if (this.interval_id === undefined) {
      console.error("[Error] Spinner is not spinning yet.");
      return;
    }

    clearInterval(this.interval_id);
    this.interval_id = undefined;
    this.counter = 0;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0); 
  }

  changeMessage(msg: string) {
    this.message = msg;
  }
};

export default Spinner;