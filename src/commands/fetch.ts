import * as types from '../types';
import * as utils from '../utils';
import * as lc from '../leetcode';
import * as gqlQueries from '../gqlqueries';

const FetchCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
  const is_by_id = data[2] !== undefined;

  // Two possible ways to fetch the question. The first way is by ID.
  let problems_data: types.ProblemsData | null = null;

  if (is_by_id) {
    const category = state.variables[0].value as string;
    problems_data = await lc.FetchProblems(
      {category: category, limit: 1, skip: Number.parseInt(data[2])-1},
      utils.FormatProblemsData, gqlQueries.problemListQuery
    );
    
    if (!problems_data) {
      console.error(`No problem with ID ${data[2]}`);
      return state;
    }
  } else {
    const category = state.variables[0].value as string;
    problems_data = await lc.FetchProblems(
      {category: category}, utils.FormatProblemsData, gqlQueries.problemListQuery
    );

    if (!problems_data) return state;

    const selected_problem = problems_data.problemsetQuestionList.filter(
      (value: types.QuestionGenericData) : boolean => (value.titleSlug === data[1])
    );

    if (selected_problem.length < 1) {
      console.error(`No problem with title ${data[1]}`);
      return state;
    }

    problems_data.count = 1;
    problems_data.problemsetQuestionList = selected_problem;
  }

  utils.PrintProblemsSummary(problems_data);

  // Add the problems to the state
  if (state.lastSelectedProblems === undefined) {
    state.lastSelectedProblems = problems_data;
  } else {
    state.lastSelectedProblems.problemsetQuestionList.push(problems_data.problemsetQuestionList[0]);
    state.lastSelectedProblems.count++;
  }

  return state;
}

// Fetch Command - "Download" a single question
const fetch_command: types.AppCommandData = {
  name     : 'Fetch Command',
  command  : 'fetch',
  syntax   : /^fetch\s+(NAME\s+([\w\-]+)|ID\s+(\d+)){1,}$/,
  callback : FetchCommand,

  help: 'fetch <NAME|ID> <value> - Fetch locally a single problem from remote. Notice\n'      +
        'that: NAME is the title-slug which means the real title lower-case and spaces\n'     +
        'replaced by `-`; ID is the frontend Id, i.e., the number identifying the problem.\n'
};

export default fetch_command;