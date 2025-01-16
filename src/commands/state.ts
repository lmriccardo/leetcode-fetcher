/**
 * @author Riccardo La Marca
 * 
 * @brief State-releated Commands:
 *  - save  [Save the current state into a json file]
 *  - load  [Load a saved state from a json file]
 *  - set   [Set the value of a variable in the state]
 *  - unset [Reset the value of a variable in the state]
 *  - show  [Shows the current state (non-sensitive information)]
 */

import * as types from '../types';
import * as utils from '../utils';
import * as fs from 'fs';
import * as path from 'path'

export const app_variables: types.Variable[] =
  [
    { name: 'CATEGORY', match: 'CATEGORY\\s(\\w+)', value: "algorithms", default: "algorithms", type: "s" },
    { name: 'LIMIT', match: 'LIMIT\\s(\\d+)', value: 20, default: 20, type: "n" },
    { name: 'SKIP', match: 'SKIP\\s(\\d+)', value: 0, default: 0, type: "n" },
    { name: 'DIFFICULTY', match: 'DIFFICULTY\\s(\\w+)', value: "EASY", default: "ALL", type: "s" },
    { name: 'FOLDER', match: 'FOLDER\\s([\\w\\./-]+)', value: './problems', default: "./problems", type: "s" },
  ];

const working_values: string[] =
  [
    "(Possible values: algorithms)",
    "(Possible values: 1...Inf)",
    "(Possible values: 1...Inf)",
    "(Possible values: Easy, Medium, Hard, All)",
    "(Possible values: any folder name)"
  ];

const ConstructRegex = (name: string, vars: types.Variable[], unset?: boolean): RegExp => {
  const prefix = utils.FormatString("^{0}", name);

  const regex_str = vars.map((value: types.Variable): string => {
    const name_val = "(" + value.name + ")";
    return utils.FormatString("(?:\\s+{0})?", (unset || false) ? name_val : value.match);
  }).reduce((prev: string, curr: string) => (prev + curr));

  return new RegExp(prefix + regex_str);
}

const SetCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => {
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
export const set_command: types.AppCommandData = {
  group: 'State',
  name: 'Set Command',
  command: 'set',
  syntax: ConstructRegex('set', app_variables),
  callback: SetCommand,

  help: 'set [VAR <value> ...] - Sets the value of a specific variable.\n' +
    'To inspect which variables and values for each of them use the\n' +
    '`show` command. Notice that, if multiple values needs to be set\n' +
    'the order in which they appear in the command must be the same\n' +
    'as shown in the `show` command.\n'
};

const UnsetCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => {
  // If no values are passed then all variables are resetted
  const condition = data.every((x: string): boolean => (x === undefined));
  if (condition) data = state.variables.map((x: types.Variable): string => x.name);

  for (let index = 0; index < data.length; index++) {
    if (data[index] === undefined) continue;
    state.variables[index].value = state.variables[index].default;
  }

  return state;
}

// Unset Command - Set variables to their default value
export const unset_command: types.AppCommandData = {
  group: 'State',
  name: 'Unset Command',
  command: 'unset',
  syntax: ConstructRegex('unset', app_variables, true),
  callback: UnsetCommand,

  help: 'unset [VAR1 VAR2 ...] - Unset a variable by bringing back to its\n' +
    'default value. Notice that the same rules of `set` holds here.\n' +
    'If no variables are specified, consider resetting all of them.\n'
};

const SaveCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => {
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
    userLogin: state.userLogin || null,
    cookies: state.cookies || null,
    variables: state.variables.map((x: types.Variable)
      : { name: string, value: string | number } => (
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
export const save_command: types.AppCommandData = {
  group: 'State',
  name: 'Save State Command',
  command: 'save',
  syntax: /^save\s+([\w/\.\-]+\.json)$/,
  callback: SaveCommand,

  help: 'save FILEPATH - Saves the current state into a json file\n'
};

const IfNullUndefined = (data?: any | null): any | undefined => {
  if (data) return data;
  return undefined;
}

const LoadCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => {
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

  const content = fs.readFileSync(filename, { encoding: 'utf-8' });
  const content_data = JSON.parse(content) as types.AppStateData;

  // Modify the state with the loaded informations
  state.lastCommand = IfNullUndefined(content_data.lastCommand);
  state.lastQuestion = IfNullUndefined(content_data.lastQuestion);
  state.lastSelectedProblems = IfNullUndefined(content_data.lastSelectedProblems);
  state.selectedUser = IfNullUndefined(content_data.selectedUser);
  state.userLogin = IfNullUndefined(content_data.userLogin);
  state.cookies = IfNullUndefined(content_data.cookies);

  for (let i = 0; i < state.variables.length; i++) {
    state.variables[i].value = content_data.variables[i].value;
  }

  console.log("Loaded state from:", filename);

  return state;
}

// Load command - load the state from a json file
export const load_command: types.AppCommandData = {
  group: 'State',
  name: 'Load State Command',
  command: 'load',
  syntax: /^load\s+([\w/\.\-]+\.json)$/,
  callback: LoadCommand,

  help: 'load FILEPATH - Load the state from a json file\n'
}

const ShowCommand = async (_: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  // Shows some variables and informations about the state
  console.log("STATE INFORMATIONS\n------------------");
  console.log("Last Command:", state.lastCommand);
  console.log("Logged-in User:", state.selectedUser);
  
  if (state.lastSelectedProblems !== undefined) {
    console.log("");
    utils.PrintProblemsSummary(state.lastSelectedProblems);
  } else {
    console.log("Total Problems:", state.lastSelectedProblems);
  }

  if (state.lastQuestion !== undefined) {
    console.log("");
    utils.PrintQuestionSummary(state.lastQuestion);
  } else {
    console.log("Last Question:", state.lastQuestion);
  }
  
  console.log("\nVARIABLES\n---------");
  state.variables.forEach((value: types.Variable, idx: number) => {
    console.log(utils.FormatString("{0} => {1} {2}",  value.name, 
      value.value.toString(), working_values[idx]));
  });

  console.log("");

  return state;
}

// Show Command - shows some informations of the app state
export const show_command: types.AppCommandData = {
  group    : 'State',
  name     : 'Show Command',
  command  : 'show',
  syntax   : /^show$/,
  callback : ShowCommand,

  help: 'show - Shows values and informations about the state.\n'
};