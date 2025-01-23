/**
 * @author Riccardo La Marca
 * 
 * @brief Problems-releated Commands:
 *  - list   [List and fetch a number of problems from leetcode]
 *  - fetch  [Fetch a single problems from leetcode]
 *  - detail [Provides more informations about a fetched problem]
 *  - create [Creates a local instance of a fetched problem]
 *  - daily  [Fetch the current daily question]
 */

import * as types from '../types';
import * as utils from '../utils';
import * as lc from '../leetcode';
import { Spinner } from '../pprint';
import chalk from 'chalk';

const ListCommand = async (_: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  const spinner = new Spinner("Fetching Problem List with provided filters");
  spinner.start();

  const category = state.variables["CATEGORY"].value as string; // The category filter
  const limit = state.variables["LIMIT"].value as number; // The limit filter
  const skip = state.variables["SKIP"].value as number; // The skip filter
  const difficulty = (state.variables["DIFFICULTY"].value as string).toUpperCase();

  var diff_filter: string | undefined = difficulty;
  if (difficulty === "ALL") diff_filter = undefined;

  // We need to set the cookies for obtain the current status
  let header = utils.FormatCookies(state.cookies);

  const problems_data = await lc.FetchProblemList(
    {
      categorySlug: category, 
      limit: limit, 
      skip: skip, 
      filters: {diff_filter}
    },
    header
  );

  spinner.stop();

  if (!problems_data) return state;

  // Shows the problems and some informations
  utils.PrintUsedFilters(state.variables);
  await utils.PrintProblemsSummary(problems_data, state.variables);

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
  const spinner = new Spinner("");

  const is_by_id = data[2] !== undefined;

  // Two possible ways to fetch the question. The first way is by ID.
  let problems_data: types.ProblemsData | null = null;
  let problem_id = Number.parseInt(data[2]) ?? null;

  if (!is_by_id) {
    const title = data[1];
    spinner.changeMessage(`Searching Question ID for: ${title}`);
    spinner.start();

    const problem_result = await lc.FetchQuestion({titleSlug: title});
    spinner.stop();

    if (!problem_result) {
      console.error(chalk.redBright("[ERROR] No results found"));
      return state;
    }

    problem_id = problem_result.question.questionFrontendId;
    
  }

  spinner.changeMessage(`Fetching Problem ID: ${problem_id}`);
  spinner.start();

  // Check if the problem has already been fetched
  if (state.lastSelectedProblems !== undefined) {
    const search_result = state.lastSelectedProblems.problemsetQuestionList.filter(
      (question) => (question.questionFrontendId === problem_id));

    if (search_result.length > 0) {
      spinner.stop();
      console.log(chalk.greenBright("[INFO] Question seems already fetched."));
      return state;
    }
  }
  
  // We need to set the cookies for obtain the current status
  let header = utils.FormatCookies(state.cookies);
  problems_data = await lc.FetchProblemList(
    { categorySlug: '',  limit: 1,  skip: problem_id-1, filters: {} },
    header
  );

  spinner.stop();
  
  if (!problems_data) {
    console.error(`No problem with ID ${problem_id}`);
    return state;
  }

  utils.PrintUsedFilters(state.variables);
  await utils.PrintProblemsSummary(problems_data, state.variables);

  // Add the problems to the state
  if (state.lastSelectedProblems === undefined) {
    state.lastSelectedProblems = problems_data;
  } else {
    const problem = problems_data.problemsetQuestionList[0];
    state.lastSelectedProblems.problemsetQuestionList.push(problem);
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
  // We need to set the cookies for obtain the current status
  let header = utils.FormatCookies(state.cookies);
  const problems_data = await lc.FetchProblemList(
    {categorySlug: "", limit: 1, skip: problem_id-1, filters: {}}, header
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
  const spinner = new Spinner('');

  // Obtain the problem title from the current state if exists
  if (state.lastSelectedProblems === undefined) {
    console.error(chalk.redBright("[ERROR] ")                                                    +
      chalk.redBright("No locally fetched problems. Consider running `fetch` or `list` command") + 
      chalk.redBright("before `create`.")
    );
    
    return state;
  }

  var problem_idxs: number[];
  const fetch_length = state.lastSelectedProblems.problemsetQuestionList.length;

  if (data[0] !== undefined) {
    const problem_idx = Number.parseInt(data[0]);
    if (problem_idx >= fetch_length) {
      console.error(chalk.redBright("[ERROR] ")                                                  +
        chalk.redBright("Given index exceeds number of locally fetched problems. Consider\n")    +
        chalk.redBright("increasing the `LIMIT` variable and run the `list` command again\n")    +
        chalk.redBright("or directly locally fetching the specified problem either providing\n") + 
        chalk.redBright("the frontend Id or the title-slug.")
      );

      return state;
    }

    problem_idxs = [problem_idx];
  } else {
    problem_idxs = Array.from({ length: fetch_length }, (_, n) => n);
  }

  var last_question: types.SingleQuestionData|null = null;

  // Get already existing problem instances
  const existing_idxs = await utils.GetExistingProblems(state.variables["FOLDER"].value as string);

  for (let idx = 0; idx < problem_idxs.length; idx++) {
    const curr_problem = state.lastSelectedProblems.problemsetQuestionList[problem_idxs[idx]];
    const frontend_id = curr_problem.questionFrontendId;
    if (existing_idxs.includes(frontend_id)) continue;

    spinner.changeMessage(`Creating instance for ${curr_problem.title}`);
    spinner.start();

    const question = await lc.FetchQuestion({titleSlug: curr_problem.titleSlug});

    last_question = question;
    
    if (!question) continue; // If there is no question, continue

    utils.CreateQuestionInstance(last_question, state.variables["FOLDER"].value as string);
  }

  spinner.stop();
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

const DailyCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> =>
{
  const spinner = new Spinner("Fetching daily question.");
  spinner.start();

  // Check if the question has been already fetched
  if (state.dailyQuestion !== undefined) {
    console.log(chalk.greenBright('[INFO] Daily question already fetched.'));
  } else {
    const daily_question = await lc.FetchDailyQuestion(); // Fetch the daily question
    
    if (!daily_question) {
      spinner.stop();
      console.log(chalk.greenBright('[INFO] No daily question for today.'));
      return state;
    }

    // Once we have fetched the daily question we need to fetch the details
    const title_slug = daily_question.activeDailyCodingChallengeQuestion.question.titleSlug;
    const details = await lc.FetchQuestion({titleSlug: title_slug});
    state.dailyQuestion = details!;

    spinner.stop();

    utils.PrintQuestionSummary(details!);
  }

  // Check if also the create command has been given
  if (data[0] !== undefined && data[0] === 'create') {
    spinner.changeMessage("Creating instance for daily question.");
    spinner.stop();

    const question_id = state.dailyQuestion.question.questionFrontendId;
    const folder = state.variables["FOLDER"].value as string;
    const existing_ids = await utils.GetExistingProblems(folder);
    
    if (existing_ids.includes(question_id)) {
      spinner.stop();
      console.log(chalk.greenBright('[INFO] Daily question instance already exists.'));
      return state;
    }

    // If it does not exists then create the instance
    utils.CreateQuestionInstance(state.dailyQuestion, folder);
  }

  spinner.stop();
  return state;
}

// Daily Command - Shows the question of today
export const daily_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'Daily Command',
  command  : 'daily',
  syntax   : /^daily(?:\s+(create))$/,
  callback : DailyCommand,

  help: 'daily [create] - Fetch the current daily question and optionally create an instance.'
}