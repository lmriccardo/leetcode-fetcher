import * as types from '../types';
import * as utils from '../utils';
import * as lc from '../leetcode';
import * as gqlQueries from '../queries';

const ListCommand = async (_: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
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

// List command - Lists a number of problems
const list_command: types.AppCommandData = {
  name     : 'List Problems Command',
  command  : 'list',
  syntax   : /^list$/,
  callback : ListCommand,

  help: 'list - Fetches and Lists a number of problems from leetcode.\n' +
        'Filters and all possible variables are those assigned with\n'   +
        '`set`, `unset` and shown with `show` commands. In particular\n' +
        'filters are: CATEGORY, LIMIT, SKIP and DIFFICULTY\n'
}

export default list_command;