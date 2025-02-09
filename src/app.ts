import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { daily_command } from './commands/problems';
import commands from './commands';
import constants from './constants';
import chalk from 'chalk';
import * as types from './types';
import * as formats from './utils/formatter';
import * as generic from './utils/general';

const ExcuteCommandIfExists = async (
  command: string, state: types.AppStateData, 
  commands: types.AppCommandData[]) : Promise<types.AppStateData> => 
{
  // Get the command name and check that exists
  const cmd_name = command.split(" ")[0];
  const cmd_filter = commands.filter(
    (value: types.AppCommandData) : boolean => value.command === cmd_name);

  if (cmd_filter.length < 1) {
    const error_str = formats.FormatString("No Command: {0}", command);
    console.error(chalk.redBright(error_str));
    return state;
  }

  // Otherwise, get the actual command and obtain the matching groups
  const app_command = cmd_filter[0];
  const match = command.match(app_command.syntax);
  let data = match?.slice(1, match.length) || [];

  // Execute the command
  state = await app_command.callback(data, state);
  state.lastCommand = command;

  return state;
}

const PrintEntryView = () => {
  console.log(chalk.rgb(255, 128, 0)(constants.APP.TITLE));
  console.log();

  const title_len = constants.APP.TITLE.split('\n')[0].length;
  
  const rem_size = (title_len - constants.APP.SUBTITLE.length) / 2 - 1;
  const padding  = '─'.repeat(rem_size); 
  const subtitle_styled = chalk.italic(chalk.gray(constants.APP.SUBTITLE));
  const complete_subtitle = `${padding} ${subtitle_styled} ${padding}`;
  console.log(complete_subtitle);
  console.log();

  const author_name = chalk.bold("Riccardo La Marca");
  const author_email = chalk.italic("riccardo.lamarca98@gmail.com");
  const repo_url = chalk.underline('https://github.com/lmriccardo/leetcode-fetcher.git')

  console.log(`@${chalk.gray("Author")}      ${author_name} <${author_email}>`)
  console.log(`@${chalk.gray("Repository")}  ${repo_url}`)
  console.log(`@${chalk.gray("Version")}     v0.1.2`)
  console.log();
}

export const RunApp = async () => {
  PrintEntryView();

  // Fetch the total number of problems for each difficulty
  const nproblems = await generic.GetAllProblemsCount();
  const totals = generic.ArraySum(...Object.values(nproblems));
  const counts = {...nproblems, ALL: totals};

  // Initialize the app state
  let app_state = 
  { 
    commands: commands, 
    variables: constants.APP.APP_VARIABLES, 
    problemsCount: counts 
  } as types.AppStateData;

  app_state = await daily_command.callback([""], app_state);
  
  const question = chalk.magentaBright(">> (Type help for commands): ");

  // Loop indefinitely up until the quit command is not given
  for (; ;) {
    const date_now = (new Date()).toLocaleString('en-IT');

    // Create the interface for reading the stdin
    const rl = createInterface({ input, output });
    const answer = (await rl.question(`[${chalk.blueBright(date_now)}] ${question}`)).trim();
    rl.close();
    
    if (answer.length < 1) continue; // Check that there is a command

    // Otherwise execute the command
    app_state = await ExcuteCommandIfExists(answer, app_state, commands);

    if (answer === 'quit') {
      break;
    }
  }
}