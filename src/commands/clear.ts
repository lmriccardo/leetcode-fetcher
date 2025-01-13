import * as types from '../types';

const ClearCommand = async (_: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
    console.clear();
    return state;
}

// Create Command - "Download" a problem instance locally
const clear_command: types.AppCommandData = {
  name     : 'Clear Command',
  command  : 'clear',
  syntax   : /^clear$/,
  callback : ClearCommand,

  help: 'clear - Clear the screen content.\n'
};

export default clear_command;