import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import * as types from './types'
import * as utils from './utils'
import * as lc from './leetcode'
import * as gqlQueries from './gqlqueries'

const app_variables : types.Variable[] = 
  [
    { name: 'CATEGORY',   match: 'CATEGORY\\s(\\w+)',   value: "algorithms", default: "algorithms", type: "s"},
    { name: 'LIMIT',      match: 'LIMIT\\s(\\d+)',      value: 20          , default: 20          , type: "n"},
    { name: 'SKIP',       match: 'SKIP\\s(\\d+)',       value: 0           , default: 0           , type: "n"},
    { name: 'DIFFICULTY', match: 'DIFFICULTY\\s(\\w+)', value: "EASY"      , default: "EASY"      , type: "s"}
  ];

const working_values: string[] = 
  [
    "(Possible values: algorithms)",
    "(Possible values: 1...Inf)",
    "(Possible values: 1...Inf)",
    "(Possible values: Easy, Medium, Hard, All)"
  ];

const ConstructRegex = (name: string, vars: types.Variable[], unset?: boolean) : RegExp => {
  const prefix = utils.FormatString("^{0}", name);

  const regex_str = vars.map((value: types.Variable) : string => {
    const name_val = "(" + value.name + ")";
    return utils.FormatString("(?:\\s+{0})?", (unset || false) ? name_val : value.match);
  }).reduce((prev: string, curr: string) => (prev + curr));

  return new RegExp(prefix + regex_str);
} 

const HelpCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
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

const UnsetCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  // If no values are passed then all variables are resetted
  const condition = data.every((x: string) : boolean => (x === undefined));
  if (condition) data = state.variables.map((x: types.Variable) : string => x.name);

  for (let index = 0; index < data.length; index++) {
    if (data[index] === undefined) continue;
    state.variables[index].value = state.variables[index].default;
  }

  return state;
}

const ListCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  const category = state.variables[0].value as string; // The category filter
  const limit = state.variables[1].value as number; // The limit filter
  const skip = state.variables[2].value as number; // The skip filter
  let difficulty = (state.variables[3].value as string).toUpperCase();
  if (difficulty === "ALL") difficulty = ""; 

  const problems_data = await lc.FetchProblems(
    {category: category, limit: limit, skip: skip, difficulty: difficulty},
    utils.FormatProblemsData, gqlQueries.problemListQuery
  );

  if (!problems_data) return state;

  // Shows the problems and some informations
  utils.PrintProblemsSummary(problems_data);

  // Save the list of problems into the state
  state.lastSelectedProblems = problems_data;
  return state;
}

const DetailCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  const is_local = data[1] === 'BYIDX' || data[1] === undefined;
  const problem_id = Number.parseInt(data[0]);

  // If local then fetch from local storage and print
  if (is_local) {
    console.log(state.lastSelectedProblems?.problemsetQuestionList[problem_id]);
    return state;
  }

  // Otherwise, fetch using the API
  const category = state.variables[0].value as string;
  const problems_data = await lc.FetchProblems(
    {category: category, limit: 1, skip: problem_id-1},
    utils.FormatProblemsData, gqlQueries.problemListQuery
  );

  if (problems_data) console.log(problems_data.problemsetQuestionList[0]);

  return state;
}

const CreateCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  return state;
}

const ShowCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  // Shows some variables and informations about the state
  console.log("STATE INFORMATIONS\n------------------");
  console.log("Last Command:", state.lastCommand || "EMPTY");
  console.log("Selected User:", state.selectedUser || "EMPTY");
  
  if (state.lastSelectedProblems !== undefined) {
    utils.PrintProblemsSummary(state.lastSelectedProblems);
  } else {
    console.log("Total Problems: EMPTY");
  }
  
  console.log("\nVARIABLES\n---------");
  state.variables.forEach((value: types.Variable, idx: number) => {
    console.log(utils.FormatString("{0} => {1} {2}",  value.name, 
      value.value.toString(), working_values[idx]));
  });

  console.log("");

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

// Show Command - shows some informations of the app state
const show_command: types.AppCommandData = {
  name     : 'Show Command',
  command  : 'show',
  syntax   : /^show$/,
  callback : ShowCommand,

  help: 'show - Shows values and informations about the state.\n'
}

// List command - Lists a number of problems
const list_command: types.AppCommandData = {
  name     : 'List Problems Command',
  command  : 'list',
  syntax   : /^list$/,
  callback : ListCommand,

  help: 'list - Fetches and Lists a number of problems from leetcode.\n' +
        'Filters and all possible variables are those assigned with\n'   +
        '`set`, `unset` and shown with `show` commands.\n'
}

// Detail Command - Retrieve more informations about a problem
const detail_command: types.AppCommandData = {
  name     : 'Detail Command',
  command  : 'detail',
  syntax   : /^detail\s+(\d+)(?:\s+(BYID|BYIDX))?$/,
  callback : DetailCommand,

  help: 'detail <ID/IDX> [BYID|BYIDX] - Print more details about a single problem.\n'    +
        'The problem is specified either by "local" index, meaning among those that\n'   +
        'were previously fetched using the `list` command, or by absolute problem Id.\n' +
        'IDX = local indexing, ID = Absolute problem ID. By default, if the second\n'    +
        'is not specified, it is intended as IDX not ID.\n'
}

const RegisterCommands = () : types.AppCommandData[] => {
  const commands: types.AppCommandData[] = 
      [
        help_command, set_command, unset_command, show_command,
        list_command, detail_command
      ];

  return commands;
}

const ExcuteCommandIfExists = async (
  command: string, state: types.AppStateData, 
  commands: types.AppCommandData[]) : Promise<types.AppStateData> => 
{
  // Get the command name and check that exists
  const cmd_name = command.split(" ")[0];
  const cmd_filter = commands.filter(
    (value: types.AppCommandData) : boolean => value.command === cmd_name);

  if (cmd_filter.length < 1) {
    const error_str = utils.FormatString("No Command: {0}", command);
    console.error(error_str);
    return state;
  }

  // Otherwise, get the actual command and obtain the matching groups
  const app_command = cmd_filter[0];
  const match = command.match(app_command.syntax);
  let data = match?.slice(1, match.length) || [];

  // Execute the command
  state = await app_command.callback(data, state);
  state.lastCommand = command;

  return state;
}

export const RunApp = async () => {
  // First let's register all the commands
  const commands = RegisterCommands();

  // Initialize the app state
  let app_state = { commands: commands, variables: app_variables } as types.AppStateData;

  // Create the interface for reading the stdin
  const rl = createInterface({ input, output });

  // Loop indefinitely up until the quit command is not given
  for (; ;) {
    const answer = (await rl.question(">> (Type help for commands): ")).trim();
    if (answer.length < 1) continue; // Check that there is a command

    // Otherwise execute the command
    app_state = await ExcuteCommandIfExists(answer, app_state, commands);

    if (answer === 'quit') {
      break;
    }
  }

  rl.close();
}