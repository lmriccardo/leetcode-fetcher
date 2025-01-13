import * as types from '../types';
import { ConstructRegex, app_variables } from './utils';

const UnsetCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  // If no values are passed then all variables are resetted
  const condition = data.every((x: string) : boolean => (x === undefined));
  if (condition) data = state.variables.map((x: types.Variable) : string => x.name);

  for (let index = 0; index < data.length; index++) {
    if (data[index] === undefined) continue;
    state.variables[index].value = state.variables[index].default;
  }

  return state;
}

// Unset Command - Set variables to their default value
const unset_command: types.AppCommandData = {
  name     : 'Unset Command',
  command  : 'unset',
  syntax   : ConstructRegex('unset', app_variables, true),
  callback : UnsetCommand,

  help: 'unset [VAR1 VAR2 ...] - Unset a variable by bringing back to its\n' +
        'default value. Notice that the same rules of `set` holds here.\n'   +
        'If no variables are specified, consider resetting all of them.\n'
}

export default unset_command;