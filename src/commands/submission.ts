/**
 * @author Riccardo La Marca
 * 
 * @brief Submission-releated Commands:
 *  - watch  [Cache the given problem id for future tests or submissions]
 *  - run    [Run the tests for specified or cached question identifier]
 *  - submit [Submit the code of specified or cached question]
 */

import prompt from 'prompt';
import chalk from 'chalk';
import { daily_command } from './problems';
import * as types from '../types'
import * as utils from '../utils'
import constants from '../constants';

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
      prompt.message = '';
      prompt.delimiter = '';

      const { response } = await prompt.get(constants.PROMPT.CREATE_QUESTION);

      if (response === 'N') {
        console.error(chalk.redBright("[ERROR] Watch command exists."));
        return state;
      }

      state = await daily_command.callback(["create"], state);
    }

    state.watchQuestionId = problem_id;
    state.watchQuestion = state.dailyQuestion;
    console.log(chalk.greenBright(`[INFO] Watching Problem ID ${problem_id}`));
  } else {

  }

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