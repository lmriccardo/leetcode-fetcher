import * as types from '../types';
import * as fs from 'fs';

const IfNullUndefined = (data?: any | null) : any | undefined => {
    if (data) return data;
    return undefined;
}

const LoadCommand = async (data: string[], state: types.AppStateData) 
    : Promise<types.AppStateData> => 
{
    if (data.length < 1) {
        console.error("Missing the target filename");
        return state;
    }

    const filename = data[0];

    // Check that the provided file exists
    if (!fs.existsSync(filename)) {
        console.error(`File ${filename} does not exists`);
        return state;
    }

    const content = fs.readFileSync(filename, {encoding: 'utf-8'});
    const content_data = JSON.parse(content) as types.AppStateData;

    // Modify the state with the loaded informations
    state.lastCommand = IfNullUndefined(content_data.lastCommand);
    state.lastQuestion = IfNullUndefined(content_data.lastQuestion);
    state.lastSelectedProblems = IfNullUndefined(content_data.lastSelectedProblems);
    state.selectedUser = IfNullUndefined(content_data.selectedUser);

    for (let i = 0; i < state.variables.length; i++) {
        state.variables[i].value = content_data.variables[i].value;
    }

    console.log("Loaded state from:", filename);

    return state;
}

// Load command - load the state from a json file
const load_command: types.AppCommandData = {
  name     : 'Load State Command',
  command  : 'load',
  syntax   : /^load\s+([\w/\.\-]+\.json)$/,
  callback : LoadCommand,

  help: 'load FILEPATH - Load the state from a json file\n'
}

export default load_command;