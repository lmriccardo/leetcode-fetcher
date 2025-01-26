/**
 * @author Riccardo La Marca
 * 
 * @brief Submission-releated Commands:
 *  - watch  [Cache the given problem id for future tests or submissions]
 *  - test   [Run the tests for specified or cached question identifier]
 *  - submit [Submit the code of specified or cached question]
 */

import prompt from 'prompt';
import chalk from 'chalk';
import constants from '../constants';
import { daily_command, create_command } from './problems';
import * as types from '../types'
import * as utils from '../utils'
import * as lc from '../leetcode'

const AskForCreation = async (state: types.AppStateData) : Promise<types.AppStateData | null> => 
{
  prompt.message = '';
  prompt.delimiter = ''; 
  
  try {
    const { answer } = await prompt.get(constants.PROMPT.CREATE_QUESTION);
    if (answer === 'Y') return state;
    console.error(chalk.redBright("[ERROR] Watch command exits."));
  } catch (error) {
    return null;
  }

  return null;
}

const WatchCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> =>
{
  if (data.length < 1) {
    console.error(chalk.redBright("[ERROR] At least one input must be given."));
    return state;
  }

  const is_daily = data[0] === 'daily';
  const instances = await utils.GetExistingProblems(state.variables["FOLDER"].value as string);

  // If the input is given, we need to check that the provided IDX
  // belongs to the set of already created instances.
  let problem_id = 0;
  if (is_daily) {
    if (!state.dailyQuestion) {
      console.error(chalk.redBright("[ERROR] No daily question available."));
      return state;
    }

    problem_id = state.dailyQuestion.question.questionFrontendId;

    // Check that there exists an instance of the given problem ID
    if (!instances.includes(Number.parseInt(problem_id.toString()))) {
      console.warn(chalk.yellowBright("[WARNING] No local instance found."));
      const result = await AskForCreation(state);
      if (!result) return state;
      state = await daily_command.callback(["create"], state);
    }

    state.watchQuestionId = problem_id;
    state.watchQuestion = state.dailyQuestion;
  } else {
    // First wee need to check that there are locally fetched problems
    if (!state.lastSelectedProblems) {
      console.error(chalk.redBright("[ERROR] No locally fetched problems available."));
      return state;
    }

    // Otherwise take the corresponding problem and see
    // if a corresponding instance exists
    const problem_idx = Number.parseInt(data[0]);
    if (problem_idx >= state.lastSelectedProblems.problemsetQuestionList.length) {
      console.error(chalk.redBright("[ERROR] Input index exceeds fetched problems"));
      return state;
    }

    const problem = state.lastSelectedProblems.problemsetQuestionList[problem_idx];
    problem_id = problem.questionFrontendId;

    if (!instances.includes(Number.parseInt(problem_id.toString()))) {
      console.warn(chalk.yellowBright("[WARNING] No local instance found."));
      const result = await AskForCreation(state);
      if (!result) return state;
      state = await create_command.callback([data[0]], state);
    }
    
    state.watchQuestionId = problem_id;
    state.watchQuestion = (await lc.FetchQuestion({titleSlug: problem.titleSlug}))!;
  }

  console.log(chalk.greenBright(`[INFO] Watching Problem ID ${problem_id}`));
  return state;
}

export const watch_command: types.AppCommandData = {
  group: 'Submission',
  name: 'Watch Command',
  command: 'watch',
  syntax: /^watch\s+(\d+|daily)$/,
  callback: WatchCommand,

  help: 'watch <question-idx|daily> - Cache the given problem for future tests\n' +
        'or submissions. An instance of the given problem must exists.\n'   +
        'Moreover the provided problem must also be locally fetched.'
}

const TestCommand = async (_: string[], state: types.AppStateData)
  : Promise<types.AppStateData> =>
{
  // First we need to check if a session is currently available
  if (!state.cookies) {
    console.error(chalk.redBright('[ERROR] No current in a session.' + 
      ' Please login or load a valid session!'));

    return state;
  }

  // Then we check for watching selected problems
  if (!state.watchQuestionId) {
    console.error(chalk.redBright('[ERROR] No problem current being watched.'));
    return state;
  }

  const result = await lc.TestSolution(state);

  if (!result) {
    console.error(chalk.redBright("[ERROR] Something went wrong!"));
    return state;
  }

  utils.PrintTestDetails(state.watchQuestion!, result);

  return state;
}

// Test Command - test the solution implementation
export const test_command: types.AppCommandData = {
  group: 'Submission',
  name: 'Test Command',
  command: 'test',
  syntax: /^test$/,
  callback: TestCommand,

  help: 'test - Tests the selected problem in leetcode.'
}

const SubmitCommand = async (_: string[], state: types.AppStateData)
  : Promise<types.AppStateData> =>
{
  // First we need to check if a session is currently available
  if (!state.cookies) {
    console.error(chalk.redBright('[ERROR] No current in a session.' + 
      ' Please login or load a valid session!'));

    return state;
  }

  // Then we check for watching selected problems
  if (!state.watchQuestionId) {
    console.error(chalk.redBright('[ERROR] No problem current being watched.'));
    return state;
  }

  const result = await lc.SubmitSolution(state);
  if (!result) {
    console.error(chalk.redBright("[ERROR] Something went wrong!"));
    return state;
  }

  utils.PrintSubmissionResults(state.watchQuestion!, result);
  state.profile = await lc.GetUserData(state.selectedUser!, state);

  return state;
}

export const submit_command: types.AppCommandData = {
  group: 'Submission',
  name: 'Submit Command',
  command: 'submit',
  syntax: /^submit$/,
  callback: SubmitCommand,

  help: 'submit - Submit the selected problem solution in leetcode.'
};