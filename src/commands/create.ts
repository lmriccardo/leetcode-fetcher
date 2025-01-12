import * as types from '../types';
import * as utils from '../utils';
import * as lc from '../leetcode';
import * as gqlQueries from '../gqlqueries';

const CreateCommand = async (data: string[], state: types.AppStateData) : Promise<types.AppStateData> => {
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

  for (let idx = 0; idx < problem_idxs.length; idx++) {
    const question = await lc.FetchQuestion(
      state.lastSelectedProblems.problemsetQuestionList[problem_idxs[idx]].titleSlug,
      utils.FormatQuestionData, gqlQueries.singleProblemQuery
    );

    last_question = question;
    
    if (!question) continue; // If there is no question, continue

    utils.CreateQuestionInstance(last_question, state.variables[4].value as string);
  }

  state.lastQuestion = (last_question) ? last_question : undefined;

  return state;
}

// Create Command - "Download" a problem instance locally
const create_command: types.AppCommandData = {
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

export default create_command;