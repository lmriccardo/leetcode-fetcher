import * as types from '../types';
import * as fs from 'fs';
import * as path from 'path'

const SaveCommand = async (data: string[], state: types.AppStateData) 
    : Promise<types.AppStateData> => 
{
    if (data.length < 1) {
        console.error("Missing the target filename");
        return state;
    }

    // Select the data to save into the json file
    const content_data = {
        lastCommand: state.lastCommand || null,
        lastSelectedProblems: state.lastSelectedProblems || null,
        lastQuestion: state.lastQuestion || null,
        selectedUser: state.selectedUser || null,
        variables: state.variables.map((x: types.Variable) 
            : { name: string, value: string|number } => (
                {
                    name: x.name,
                    value: x.value
                }
            ))
    };
    
    const filename = data[0]; // Take the filename from the data
    const content = JSON.stringify(content_data, null, 2);

    // Check if the parent path of the filename exists
    const parent = path.dirname(filename);
    if (!fs.existsSync(parent)) {
        if (fs.mkdirSync(parent, 0o777) === undefined) {
            console.error("Impossible to create parent path of provided file");
            return state;
        }
    }

    fs.writeFileSync(filename, content);
    console.log("Current state saved into:", filename);
    return state;
}

// Save command - Save the state into a json file
const save_command: types.AppCommandData = {
  name     : 'Save State Command',
  command  : 'save',
  syntax   : /^save\s+([\w/\.\-]+\.json)$/,
  callback : SaveCommand,

  help: 'save FILEPATH - Saves the current state into a json file\n'
}

export default save_command;