/**
 * @author Riccardo La Marca
 * 
 * @brief Generic commands:
 *  - help  [Shows the helper message for each command or a specified one]
 *  - clear [Clear the screen content]
 *  - quit  [Quit the application]
 */

import * as types from '../types'
import * as formatter from '../utils/formatter'

const HelpCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  // First we need to filter the commands given the input ones
  const filter_result = state.commands.filter(
    (value: types.AppCommandData) : boolean => data.includes(value.command));

  if (data.length > 0) {
    const command = filter_result[0];
    const separator_str = '-'.repeat(command.name.length);
    console.log(formatter.FormatString("{0}\n{1}\n{2}", command.name, 
      separator_str, command.help));
  } else {
    const commands: Record<string, types.AppCommandData[]> = {};
    state.commands.forEach((v: types.AppCommandData) => {
      const group = v.group || 'Generic';
      if (!(group in commands)) commands[group] = [];
      commands[group].push(v);
    });

    for (const group in commands) {
      console.log(`####################### ${group} Commands List #######################\n`);
      commands[group].forEach((cmd: types.AppCommandData) => {
        const separator_str = '-'.repeat(cmd.name.length);
        console.log(formatter.FormatString("{0}\n{1}\n{2}", cmd.name, 
          separator_str, cmd.help));
      });
      console.log();
    }
  }

  // Do not modify the state, but it must returns it
  return state;
}

// Help Command
export const help_command: types.AppCommandData = {
  group    : 'Generic',
  name     : 'Help Command',
  command  : 'help',
  syntax   : /\b\w+\b/g,
  callback : HelpCommand,
  
  help: 'help [cmd1 cmd2 ...] - Shows the helper string for each specified command.\n' +
        'If no command is specified, then consider all existing commands.\n',
};

const ClearCommand = async (_: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
    console.clear();
    return state;
}

// Create Command - "Download" a problem instance locally
export const clear_command: types.AppCommandData = {
  group    : 'Generic',
  name     : 'Clear Command',
  command  : 'clear',
  syntax   : /^clear$/,
  callback : ClearCommand,

  help: 'clear - Clear the screen content.\n'
};

export const quit_command: types.AppCommandData = {
  group    : 'Generic',
  name     : 'Quit Command',
  command  : 'quit',
  syntax   : /^quit$/,
  callback : async (_: string[], state: types.AppStateData) => state,

  help: 'quit - Quit the application.\n'
}