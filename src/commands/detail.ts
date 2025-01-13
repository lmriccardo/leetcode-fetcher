import * as types from '../types';
import * as utils from '../utils';
import * as lc from '../leetcode';
import * as gqlQueries from '../queries';

const DetailCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
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

export default detail_command;