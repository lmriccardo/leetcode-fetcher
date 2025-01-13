import * as types from '../types'
import * as utils from '../utils'

const HelpCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  // First we need to filter the commands given the input ones
  const filter_result = state.commands.filter(
    (value: types.AppCommandData) : boolean => data.includes(value.command));

  const filter_commands = (data.length > 0) ? filter_result : state.commands;

  // Then we can just print for all resulting command the helper
  filter_commands.forEach((value: types.AppCommandData) => {
    const separator_str = '-'.repeat(value.name.length);
    console.log(utils.FormatString("{0}\n{1}\n{2}", value.name, 
      separator_str, value.help));
  });

  // Do not modify the state, but it must returns it
  return state;
}

// Help Command
const help_command: types.AppCommandData = {
  name     : 'Help Command',
  command  : 'help',
  syntax   : /\b\w+\b/g,
  callback : HelpCommand,
  
  help: 'help [cmd1 cmd2 ...] - Shows the helper string for each specified command.\n' +
        'If no command is specified, then consider all existing commands.\n',
};

export default help_command;