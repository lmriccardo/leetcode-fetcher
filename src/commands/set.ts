import * as types from '../types';
import { ConstructRegex, app_variables } from './utils';

const SetCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  // Take the variables that are being set by the command
  for (let index = 0; index < data.length; index++) {
    if (data[index] === undefined) continue;
    const _type = state.variables[index].type;
    state.variables[index].value = (_type === "s") ? data[index] 
      : Number.parseInt(data[index]);
  }

  return state;
}

// Set Command - Set the value of a variables
const set_command: types.AppCommandData = {
  name     : 'Set Command',
  command  : 'set',
  syntax   : ConstructRegex('set', app_variables),
  callback : SetCommand,

  help: 'set [VAR <value> ...] - Sets the value of a specific variable.\n'  +
        'To inspect which variables and values for each of them use the\n'  +
        '`show` command. Notice that, if multiple values needs to be set\n' +
        'the order in which they appear in the command must be the same\n'  +
        'as shown in the `show` command.\n'
};

export default set_command;