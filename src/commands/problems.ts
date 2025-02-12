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

import { Spinner } from '../pprint';
import { PrintProblemsSummary, PrintQuestionSummary, PrintUsedFilters } from '../utils/printer';
import chalk from 'chalk';
import * as types from '../types';
import * as lc from '../leetcode';
import * as generic from '../utils/general';
import * as formatter from '../utils/formatter';

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
  let header = formatter.FormatCookies(state.cookies);
  
  const problems_data = await lc.FetchProblemList(
    {
      categorySlug: category, 
      limit: limit, 
      skip: skip, 
      filters: {difficulty: diff_filter}
    },
    header
  );

  spinner.stop();

  if (!problems_data) return state;

  spinner.changeMessage("Fetching each problem details");
  spinner.start();

  // Then for each problem fetched, gathers other details
  const fetched_problems = await Promise.all(
    problems_data.problemsetQuestionList.questions.map(
      async (value: types.GenericQuestionData) => 
      {
        const title = value.titleSlug;
        const question_data = await lc.FetchQuestion({titleSlug: title});

        if (!question_data) {
          console.warn(chalk.yellowBright("[WARNING] Unable to fetch more details " +
            `for problem titled: ${title}`));
          
          return null;
        }

        return generic.MergeStructures<types.DetailedQuestionData>(
          value, question_data.question);
      }
    )
  );

  spinner.stop();

  
  const final_result = fetched_problems.filter((value) => value !== null);
  if (final_result.length === 0) return state;
  
  
  state.fetchedProblems = { count: final_result.length, questions: final_result };
  PrintUsedFilters(state.variables);
  await PrintProblemsSummary(state.fetchedProblems, state.variables);
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
  if (data.length < 1) {
    console.error(chalk.redBright("[ERROR] Fetch command uncorrectly formatted."));
    return state;
  }

  const spinner = new Spinner(""); // Create the spinner for dynamic logs

  // There are two possible ways to fetch a problem, the first one is by title-slug
  let question_id = Number.parseInt(data[2]) ?? null;

  if (!(data[2] !== undefined)) // Check if it is by id or by name 
  {
    // Check if the question has been already fetched
    const title_slug = data[1];

    spinner.changeMessage(`Checking if ${title_slug} is already fetched`)
    spinner.start();

    if (state.fetchedProblems) {
      const fetched = state.fetchedProblems.questions.filter(
        (value): boolean => value.titleSlug === title_slug);
      
      if (fetched.length > 0) {
        spinner.stop();
        console.log(chalk.greenBright("[INFO] Question already fetched"));
        return state;
      }
    }

    // If it does not exists, then we need to fetch the question id
    spinner.changeMessage(`Searching Question ID for ${title_slug}`)
    const problem_result = await lc.FetchQuestion({titleSlug: title_slug});
    if (!problem_result || !problem_result?.question) {
      spinner.stop();
      console.error(chalk.redBright("[ERROR] No results found"));
      return state;
    }

    question_id = Number.parseInt(problem_result.question.questionId);
  } else {
    spinner.changeMessage(`Checking if Question ID ${question_id} is already fetched`)
    spinner.start();

    // The user has provided the question id, which is the question frontend id
    // most of the time, since it is the one that leetcode shows. There is no simple
    // way to discover the actual question id from the frontend one
    if (state.fetchedProblems) {
      const fetched = state.fetchedProblems.questions.filter(
        (value): boolean => Number.parseInt(value.questionFrontendId) === question_id);
      
      if (fetched.length > 0) {
        spinner.stop();
        console.log(chalk.greenBright("[INFO] Question already fetched"));
        return state;
      }
    }
  }

  spinner.changeMessage(`Fetching Problem ID: ${question_id}`);
  
  // We need to set the cookies for obtain the current status
  let header = formatter.FormatCookies(state.cookies);
  const problems_data = await lc.FetchProblemList(
    { categorySlug: '',  limit: 1,  skip: question_id-1, filters: {} },
    header
  );

  spinner.stop(); // Stops the spinner, that was the last operation

  if (!problems_data) {
    console.error(chalk.redBright(`[ERROR] Something went wrong or no problem with ID ${question_id}`));
    return state;
  }

  // Merge the fetched problem with other details from another query
  const question_title = problems_data.problemsetQuestionList.questions[0].titleSlug;
  const question_data = await lc.FetchQuestion({titleSlug: question_title}, header);
  if (!question_data) {
    console.error(chalk.redBright(`[ERROR] Something went wrong.`));
    return state;
  }

  const detailed_data = generic.MergeStructures<types.DetailedQuestionData>(
    question_data.question, problems_data.problemsetQuestionList.questions[0]);

  await PrintProblemsSummary({count: 1, questions: [detailed_data]}, state.variables);

  if (!state.fetchedProblems) {
    state.fetchedProblems = {count: 1, questions: [detailed_data]};
  } else {
    state.fetchedProblems.count++;
    state.fetchedProblems.questions.push(detailed_data);
  }

  return state;
}

// Fetch Command - "Download" a single question
export const fetch_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'Fetch Command',
  command  : 'fetch',
  syntax   : /^fetch\s+(title\s+([\w\-]+)|id\s+(\d+)){1,}$/,
  callback : FetchCommand,

  help: 'fetch <title|id> value - Fetch locally a single problem from remote. Notice\n'        +
        'that: `title` is the title-slug which means the real title lower-case and spaces\n'   +
        'replaced by `-`; `id` is the frontend id, i.e., the number identifying the problem.\n'
};

const DetailCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  const problem_idx = Number.parseInt(data[0]); // Local index of the fetched problem

  // First we need to check for out of bound indexing
  if (!state.fetchedProblems) {
    console.error(chalk.yellowBright(
      "[WARNING] Still no fetched problems. Please" +
      "fetch using either list or fetch commads."
    ));
  }

  if (problem_idx >= state.fetchedProblems!.count) {
    console.error(chalk.redBright(
      `[ERROR] Not enough fetched problems. Maximum ${state.fetchedProblems!.count}`));
  }

  const problem_data = state.fetchedProblems!.questions[problem_idx];
  console.log(problem_data);

  return state;
}

// Detail Command - Retrieve more informations about a problem
export const detail_command: types.AppCommandData = {
  group    : 'Problems',
  name     : 'Detail Command',
  command  : 'detail',
  syntax   : /^detail\s+(\d+)$/,
  callback : DetailCommand,

  help: 'detail idx - Print more details about a single problem.\n'     +
        'The problem is specified using the `idx` parameter, which\n'   +
        'identifies the local index of the question among those that\n' +
        'have already been fetched either using `list` or `fetch`.'
};

const CreateCommand = async (data: string[], state: types.AppStateData) 
  : Promise<types.AppStateData> => 
{
  const spinner = new Spinner('');

  // Obtain the problem title from the current state if exists
  if (!state.fetchedProblems) {
    console.error(chalk.redBright("[ERROR] ")                                                    +
      chalk.redBright("No locally fetched problems. Consider running `fetch` or `list` command") + 
      chalk.redBright("before `create`.")
    );
    
    return state;
  }

  var problem_idxs: number[];
  const fetch_length = state.fetchedProblems!.count;

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

  // Get already existing problem instances
  const existing_idxs = await generic.GetExistingProblems(state.variables["FOLDER"].value as string);

  for (let idx = 0; idx < problem_idxs.length; idx++) {
    const curr_problem = state.fetchedProblems.questions[problem_idxs[idx]];
    const frontend_id = Number.parseInt(curr_problem.questionFrontendId);
    if (existing_idxs.includes(frontend_id)) continue;

    spinner.changeMessage(`Creating instance for ${curr_problem.title}`);
    spinner.start();

    generic.CreateQuestionInstance(curr_problem, state.variables["FOLDER"].value as string);
  }

  spinner.stop();
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
  const spinner = new Spinner("Fetching daily question");
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
    state.dailyQuestion = generic.MergeStructures<types.DetailedQuestionData>(
      details!.question, daily_question.activeDailyCodingChallengeQuestion.question);

    state.dailyQuestion.link = `https://leetcode.com${daily_question.activeDailyCodingChallengeQuestion.link}`;

    spinner.stop();

    PrintQuestionSummary(state.dailyQuestion);
  }

  // Check if also the create command has been given
  if (data[0] !== undefined && data[0] === 'create') {
    spinner.changeMessage("Creating instance for daily question.");
    spinner.stop();

    const question_id = Number.parseInt(state.dailyQuestion.questionFrontendId);
    const folder = state.variables["FOLDER"].value as string;
    const existing_ids = await generic.GetExistingProblems(folder);
    
    if (existing_ids.includes(question_id)) {
      spinner.stop();
      console.log(chalk.greenBright('[INFO] Daily question instance already exists.'));
      return state;
    }

    // If it does not exists then create the instance
    generic.CreateQuestionInstance(state.dailyQuestion, folder);
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