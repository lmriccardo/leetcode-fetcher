import * as types from '../types';
import * as utils from '../utils';
import { working_values } from './utils';

const ShowCommand = async (_: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  // Shows some variables and informations about the state
  console.log("STATE INFORMATIONS\n------------------");
  console.log("Last Command:", state.lastCommand || "EMPTY");
  console.log("Selected User:", state.selectedUser || "EMPTY");
  
  if (state.lastSelectedProblems !== undefined) {
    console.log("");
    utils.PrintProblemsSummary(state.lastSelectedProblems);
  } else {
    console.log("Total Problems: EMPTY");
  }

  if (state.lastQuestion !== undefined) {
    console.log("");
    utils.PrintQuestionSummary(state.lastQuestion);
  } else {
    console.log("Last Question: EMPTY");
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
const show_command: types.AppCommandData = {
  name     : 'Show Command',
  command  : 'show',
  syntax   : /^show$/,
  callback : ShowCommand,

  help: 'show - Shows values and informations about the state.\n'
}

export default show_command;