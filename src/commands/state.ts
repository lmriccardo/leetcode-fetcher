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

import prompt from 'prompt';
import * as types from '../types';
import * as utils from '../utils';
import * as fs from 'fs';
import * as path from 'path'
import constants from '../constants';
import chalk from 'chalk';

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
  // Check that there is something not undefined
  if (data.every((x) => (x === undefined))) {
    console.error(chalk.redBright("Command formatted uncorrectly."));
    return state;
  }

  // Take the variables that are being set by the command
  const keys = Object.keys(state.variables);
  for (let index = 0; index < data.length; index++) {
    if (data[index] === undefined) continue;
    const key = keys[index];
    const _type = state.variables[key].type;
    state.variables[key].value = (_type === "s") ? data[index]
      : Number.parseInt(data[index]);
  }

  return state;
}

// Set Command - Set the value of a variables
export const set_command: types.AppCommandData = {
  group: 'State',
  name: 'Set Command',
  command: 'set',
  syntax: ConstructRegex('set', Object.values(constants.APP.APP_VARIABLES)),
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
  if (condition) data = Object.keys(state.variables);

  for (let key in data) {
    if (key === undefined) continue;
    state.variables[key].value = state.variables[key].default;
  }

  return state;
}

// Unset Command - Set variables to their default value
export const unset_command: types.AppCommandData = {
  group: 'State',
  name: 'Unset Command',
  command: 'unset',
  syntax: ConstructRegex('unset', Object.values(constants.APP.APP_VARIABLES), true),
  callback: UnsetCommand,

  help: 'unset [VAR1 VAR2 ...] - Unset a variable by bringing back to its\n' +
    'default value. Notice that the same rules of `set` holds here.\n' +
    'If no variables are specified, consider resetting all of them.\n'
};

const SaveCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => {
  if (data.length < 1) {
    console.error(chalk.redBright("Missing the target filename"));
    return state;
  }

  // Check if the flag to save also the login credentials is true
  let cookies = null;
  let userLogin = null;
  let profile = null;
  
  if (state.variables['SAVE_LOGIN'].value === 1 && state.userLogin !== undefined) {
    const result = await utils.RequestPassword(state.userLogin);
    if (result) {
      cookies = state.cookies;
      userLogin = state.userLogin;
      profile = state.profile;
    }
  } else {
    cookies = state.cookies;
    userLogin = state.userLogin;
    profile = state.profile;
  }

  // Select the data to save into the json file
  const content_data = {
    lastCommand: state.lastCommand || null,
    lastSelectedProblems: state.lastSelectedProblems || null,
    lastQuestion: state.lastQuestion || null,
    selectedUser: state.selectedUser || null,
    userLogin: userLogin || null,
    profile: profile || null,
    cookies: cookies || null,
    variables: Object.values(state.variables).map((x: types.Variable)
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
      console.error(chalk.redBright("Impossible to create parent path of provided file"));
      return state;
    }
  }

  fs.writeFileSync(filename, content);
  console.log("Current state saved into:", chalk.blueBright(filename));
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
    console.error(chalk.redBright("Missing the target filename"));
    return state;
  }

  const filename = data[0];

  // Check that the provided file exists
  if (!fs.existsSync(filename)) {
    console.error(chalk.redBright(`File ${filename} does not exists`));
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
  state.profile = IfNullUndefined(content_data.profile);
  state.cookies = IfNullUndefined(content_data.cookies);
  
  let counter = 0;
  for (const key of Object.keys(state.variables)) {
    state.variables[key].value = content_data.variables[counter].value;
    counter++;
  }

  console.log("Loaded state from:", chalk.blueBright(filename));

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

const ShowCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  const sensitive = (data.length > 0) && data[0] === 'sensitive' && state.cookies !== undefined;

  let validation_result = true;
  if (sensitive && state.userLogin !== undefined) {
    validation_result = await utils.RequestPassword(state.userLogin!);
  }

  if (!validation_result) {
    console.error(chalk.redBright("Cannot show sensitive informations."));
    return state;
  }

  // Shows some variables and informations about the state
  console.log("STATE INFORMATIONS\n------------------");
  console.log("Last Command:", state.lastCommand);
  console.log("Logged-in User:", state.selectedUser);
  
  if (state.lastSelectedProblems !== undefined) {
    console.log("");
    await utils.PrintProblemsSummary(state.lastSelectedProblems, state.variables);
  } else {
    console.log("Total Problems:", state.lastSelectedProblems);
  }

  if (state.lastQuestion !== undefined) {
    console.log("");
    utils.PrintQuestionSummary(state.lastQuestion);
  } else {
    console.log("Last Question:", state.lastQuestion);
  }

  if (sensitive && validation_result) {
    console.log("\nSENSITIVE STATE INFORMATIONS\n------------------");
    console.log("Leetcode Cookies: ");
    console.log(`    LEETCODE_SESSION = ${state.cookies?.LEETCODE_SESSION}`);
    console.log(`    csrftoken = ${state.cookies?.csrftoken}`);
    console.log(`    messages = ${state.cookies?.messages}`);
    console.log("");
    console.log("User credentials: ");
    console.log(`    Username: ${state.userLogin?.username}`)
    console.log(`    Hash: ${state.userLogin?.password}`)
    console.log(`    Salt: ${state.userLogin?.salt}`)
  }
  
  console.log("\nVARIABLES\n---------");
  Object.values(state.variables).forEach((value: types.Variable, idx: number) => {
    console.log(utils.FormatString("{0} => {1} <{2} ({3})>",  value.name, 
      value.value.toString(), value.desc, value.values));
  });

  console.log("");

  return state;
}

// Show Command - shows some informations of the app state
export const show_command: types.AppCommandData = {
  group    : 'State',
  name     : 'Show Command',
  command  : 'show',
  syntax   : /^show(?:\s(sensitive))$/,
  callback : ShowCommand,

  help: 'show [SENSITIVE] - Shows values and informations about the state.\n'
};