import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { app_variables } from './commands/utils';
import * as types from './types';
import * as utils from './utils';
import * as cmds from './commands'

const RegisterCommands = () : types.AppCommandData[] => {
  const commands: types.AppCommandData[] = 
      [
        cmds.help_command, cmds.set_command,    cmds.unset_command, cmds.show_command,
        cmds.list_command, cmds.detail_command, cmds.fetch_command, cmds.create_command,
        cmds.save_command, cmds.load_command,   cmds.clear_command, cmds.login_command
      ];

  return commands;
}

const ExcuteCommandIfExists = async (
  command: string, state: types.AppStateData, 
  commands: types.AppCommandData[]) : Promise<types.AppStateData> => 
{
  // Get the command name and check that exists
  const cmd_name = command.split(" ")[0];
  const cmd_filter = commands.filter(
    (value: types.AppCommandData) : boolean => value.command === cmd_name);

  if (cmd_filter.length < 1) {
    const error_str = utils.FormatString("No Command: {0}", command);
    console.error(error_str);
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

export const RunApp = async () => {
  // First let's register all the commands
  const commands = RegisterCommands();

  // Initialize the app state
  let app_state = { commands: commands, variables: app_variables } as types.AppStateData;

  // Loop indefinitely up until the quit command is not given
  for (; ;) {
    // Create the interface for reading the stdin
    const rl = createInterface({ input, output });
    const answer = (await rl.question(">> (Type help for commands): ")).trim();
    rl.close();
    
    if (answer.length < 1) continue; // Check that there is a command

    // Otherwise execute the command
    app_state = await ExcuteCommandIfExists(answer, app_state, commands);

    if (answer === 'quit') {
      break;
    }
  }
}