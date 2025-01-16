/**
 * @author Riccardo La Marca
 * 
 * @brief Problems-releated Commands:
 *  - list   [List and fetch a number of problems from leetcode]
 *  - fetch  [Fetch a single problems from leetcode]
 *  - detail [Provides more informations about a fetched problem]
 *  - create [Creates a local instance of a fetched problem]
 */

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
export const list_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'List Problems Command',
  command  : 'list',
  syntax   : /^list$/,
  callback : ListCommand,

  help: 'list - Fetches and Lists a number of problems from leetcode.\n' +
        'Filters and all possible variables are those assigned with\n'   +
        '`set`, `unset` and shown with `show` commands. In particular\n' +
        'filters are: CATEGORY, LIMIT, SKIP and DIFFICULTY\n'
};

const FetchCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
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
export const fetch_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'Fetch Command',
  command  : 'fetch',
  syntax   : /^fetch\s+(NAME\s+([\w\-]+)|ID\s+(\d+)){1,}$/,
  callback : FetchCommand,

  help: 'fetch <NAME|ID> <value> - Fetch locally a single problem from remote. Notice\n'      +
        'that: NAME is the title-slug which means the real title lower-case and spaces\n'     +
        'replaced by `-`; ID is the frontend Id, i.e., the number identifying the problem.\n'
};

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
export const detail_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'Detail Command',
  command  : 'detail',
  syntax   : /^detail\s+(\d+)(?:\s+(BYID|BYIDX))?$/,
  callback : DetailCommand,

  help: 'detail <ID/IDX> [BYID|BYIDX] - Print more details about a single problem.\n'    +
        'The problem is specified either by "local" index, meaning among those that\n'   +
        'were previously fetched using the `list` command, or by absolute problem Id.\n' +
        'IDX = local indexing, ID = Absolute problem ID. By default, if the second\n'    +
        'is not specified, it is intended as IDX not ID.\n'
};

const CreateCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  // Obtain the problem title from the current state if exists
  if (state.lastSelectedProblems === undefined) {
    console.error(
      "No locally fetched problems. Consider running `fetch` or `list` command" + 
      "before `create`."
    );
    
    return state;
  }

  var problem_idxs: number[];
  const fetch_length = state.lastSelectedProblems.problemsetQuestionList.length;

  if (data[0] !== undefined) {
    const problem_idx = Number.parseInt(data[0]);
    if (problem_idx >= fetch_length) {
      console.error(
        "Given index exceeds number of locally fetched problems. Consider\n"    +
        "increasing the `LIMIT` variable and run the `list` command again\n"    +
        "or directly locally fetching the specified problem either providing\n" + 
        "the frontend Id or the title-slug."
      );

      return state;
    }

    problem_idxs = [problem_idx];
  } else {
    problem_idxs = Array.from({ length: fetch_length }, (_, n) => n);
  }

  var last_question: types.SingleQuestionData|null = null;

  // Get already existing problem instances
  const existing_idxs = await utils.GetExistingProblems(state.variables[4].value as string);

  for (let idx = 0; idx < problem_idxs.length; idx++) {
    const curr_problem = state.lastSelectedProblems.problemsetQuestionList[problem_idxs[idx]];
    const frontend_id = curr_problem.questionFrontendId;
    if (existing_idxs.includes(frontend_id)) continue;

    const question = await lc.FetchQuestion(
      curr_problem.titleSlug, utils.FormatQuestionData, gqlQueries.singleProblemQuery
    );

    last_question = question;
    
    if (!question) continue; // If there is no question, continue

    utils.CreateQuestionInstance(last_question, state.variables[4].value as string);
  }

  state.lastQuestion = (last_question) ? last_question : undefined;

  return state;
}

// Create Command - "Download" a problem instance locally
export const create_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'Create Command',
  command  : 'create',
  syntax   : /^create(?:\s+(\d+))?$/,
  callback : CreateCommand,

  help: 'create <IDX> - Downloads a problem instance locally given the local index.\n'     +
        'If the local index exists, it creates a new folder into the `FOLER` folder\n'     +
        'named `<id>-<titleSlug>`. This folder will contain: a README.md file and a\n'     +
        'index.html file with the problem description, and the source code file. Errors\n' +
        'when the input index is out of bound or if the list is empty. If no index is\n'   +
        'specified, then it will downloads all the fetched problems.\n'
};