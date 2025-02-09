import { join } from "path";
import { TablePrinter, RectangleBox } from "../pprint";
import { FormatString } from "./formatter";
import { GetExistingProblems, TimestampToDate } from "./general";
import chalk from "chalk";
import constants from "../constants";
import * as fs from 'fs';
import * as types from '../types';

export const PrintUsedFilters = (vars: types.Variables) => {
  // Print the used filters
  const filter_table = new TablePrinter(undefined, undefined,
    [
      { size: 23, just: -1},
      { size: 15, style: chalk.blueBright, just: -1}
    ]
  );

  constants.APP.LIST_QUERY_VARIABLES.forEach((x: string) => {
    const var_type = vars[x].type; // Take the corresponding type
    const var_value = (var_type == "n") ? vars[x].value.toString() : vars[x].value;
    filter_table.pushRow(`Used Filter ${x}:`, var_value);
  })

  filter_table.showLine = false;
  console.log(filter_table.toString());
}

export const PrintProblemsSummary = async (problems: types.FetchedProblems, vars: types.Variables) => {

  console.log("Fetched Problems :", problems.count);

  // Get the list of all problems already downloaded
  const downloaded_problems = await GetExistingProblems(vars['FOLDER'].value as string);

  // Create the table for the problem list
  const list_table = new TablePrinter(undefined,
    ['STATUS', 'IDX', 'ID', 'DIFFICULTY', 'TITLE', 'TAGS'],
    [
      {size: 8,                                        just:  1}, // Status column
      {size: 5,  style: chalk.yellowBright                     }, // Local index column
      {size: 5,  style: chalk.yellowBright                     }, // Problem ID column
      {size: 10, style: constants.APP.DIFFICULTY_STYLE         }, // The difficulty column
      {size: 65, style: chalk.italic,                  just: -1}, // The title column
      {size: 81, style: chalk.gray,                    just: -1}  // The tags column
    ]
  );

  problems.questions.forEach(
    (value: types.DetailedQuestionData, idx: number) => {
      const tags = value.topicTags
        .map((value: types.QuestionTag) : string => value.name)
        .reduce((p: string, c: string) : string => p + ", " + c);

      let status = '';

      // Check if the current question is already downloaded
      if (downloaded_problems.includes(value.questionFrontendId)) {
        status += constants.APP.EMOJIS.DOWNLOADED;
      }

      // Now check the status of the question
      if (value.status && value.status === "ac") {
        status += constants.APP.EMOJIS.CHECK;
      } else {
        status += constants.APP.EMOJIS.WRONG;
      }

      // Check if it is premium question
      if (value.paidOnly) {
        status += constants.APP.EMOJIS.NOT_FREE;
      } else {
        status += constants.APP.EMOJIS.FREE;
      }

      // Check if the video solution is available
      if (value.hasVideoSolution) {
        status += constants.APP.EMOJIS.HAS_VIDEO;
      }

      list_table.pushRow(status, idx, value.questionFrontendId, 
        value.difficulty, value.title, tags);
    }
  );

  list_table.showLine = false;
  console.log(list_table.toString());
}

export const PrintQuestionSummary = (question: types.DetailedQuestionData) => {
  console.log(FormatString("Last Question: { ID={0}, TitleSlug={1}, Link={2} }",
    question.questionFrontendId, question.titleSlug, question.link
  ));
}

const PrintSubmissionStats = (submitStats: types.UserSubmitStats) => 
{
  const total_subs = submitStats?.totalSubmissionNum;
  const acc_subs = submitStats?.acSubmissionNum;

  if (total_subs !== undefined && total_subs.length > 0 ) {
    const difficulties = total_subs.map((x) => x.difficulty);
    const columns = ['Difficulty', ...difficulties];
    const columns_props = Array(difficulties.length).fill({size: 10, style: chalk.yellowBright});
    const props = [{size: 12}, ...columns_props];
    const tsubs_table = new TablePrinter("Total Submissions Count", columns, props);

    const counts = ['Count', ...total_subs.map((x) => x.count)];
    const subnum = ['Submissions', ...total_subs.map((x) => x.submissions)];
    const accepted = ['Accepted', ...acc_subs!.map((x) => x.submissions)];
    tsubs_table.pushRow(...counts);
    tsubs_table.pushRow(...subnum);
    tsubs_table.pushRow(...accepted);

    console.log()
    console.log(tsubs_table.toString());
    console.log() 
  }
}

const PrintShortSubmissionsDetails = (submissions: types.SubmissionList) =>
{
  // For an optimal columns size, we should take the maximum between all sizes
  const sublist = submissions.submissionList;
  if (sublist.length < 1) return;

  const columns = constants.APP.SHORT_SUBMISSION.COLS;
  const colsizes = Array.from({length: columns.length}, (_, i) => columns[i].length);

  sublist.forEach((x: types.ShortSubmission) =>
  {
    const question_id_len = x.question?.questionId.length ?? 0;
    const lang_len = x.lang?.verboseName.length ?? 0;
    const runtime_len = x.runtimeDisplay?.length ?? 0;
    const memory_len = x.memoryDisplay?.length ?? 0;
    const timestamp = TimestampToDate(Number.parseInt(x.timestamp));

    colsizes[0] = Math.max(colsizes[0], x.id.length);
    colsizes[1] = Math.max(colsizes[1], x.title.length);
    colsizes[2] = Math.max(colsizes[2], question_id_len);
    colsizes[3] = Math.max(colsizes[3], timestamp.length);
    colsizes[4] = Math.max(colsizes[4], lang_len);
    colsizes[5] = Math.max(colsizes[5], runtime_len);
    colsizes[6] = Math.max(colsizes[6], memory_len);
  });

  const properties = colsizes.map((x, i) => (
    {
      size: x,
      style: constants.APP.SHORT_SUBMISSION.STYLES[i],
      just: constants.APP.SHORT_SUBMISSION.JUST[i]
    }
  ));

  const table = new TablePrinter("Recent Accepted Submissions", columns, properties);
  table.showLine = false;

  sublist.forEach((x: types.ShortSubmission) =>
  {
    const question_id = x.question?.questionId ?? "null";
    const lang = x.lang?.verboseName ?? "null";
    const runtime = x.runtimeDisplay ?? "null";
    const memory = x.memoryDisplay ?? "null";
    const timestamp = TimestampToDate(Number.parseInt(x.timestamp));

    table.pushRow(x.id, x.title, question_id, timestamp, lang, runtime, memory);
  })

  console.log()
  console.log(table.toString());
  console.log()
}

export const PrintUserSummary = (user: types.User) => {
  console.log(`${chalk.bold("Username")}   : ${chalk.blueBright(user.profile?.username)}`);
  console.log(`${chalk.bold("Real Name")}  : ${chalk.gray(user.profile?.realName)}`);
  console.log(`${chalk.bold("Profile")}    : ${chalk.underline(user.link)}`);
  
  if (user.profile?.aboutMe !== undefined && user.profile?.aboutMe !== "") {
    const about_box = new RectangleBox(80, 0, chalk.italic);
    about_box.setTitle("About Me", 4);
    about_box.setContent(user.profile?.aboutMe, {upad: 1, dpad: 1, lpad: 2, rpad: 2});
    console.log()
    console.log(about_box.toString());
    console.log()
  }

  console.log(`${chalk.bold("Reputation")} :`, user.profile?.reputation);
  console.log(`${chalk.bold("Ranking")}    :`, user.profile?.ranking);
  console.log(`${chalk.bold("Github")}     :`, chalk.underline(user.profile?.githubUrl));
  console.log(`${chalk.bold("Twitter")}    :`, chalk.underline(user.profile?.twitterUrl));
  console.log(`${chalk.bold("Linkedin")}   :`, chalk.underline(user.profile?.linkedinUrl));

  PrintSubmissionStats(user.submitStats!);
  PrintShortSubmissionsDetails(user.acSubList!);
}

export const PrintTestDetails = (problem: types.DetailedQuestionData, result: types.TestStatus) => 
{
  console.log();
  console.log(`Test results for problem: ${chalk.bold(problem.title)}`);
  console.log();
  console.log(`${chalk.italic("Runtime")}     :`, result.status_runtime!);
  console.log(`${chalk.italic("Memory")}      :`, result.status_memory!);
  console.log(`${chalk.italic("Finish Time")} :`, TimestampToDate(result.task_finish_time!));
  console.log(`${chalk.italic("Elased Time")} : ${result.elapsed_time! / 1e3} [sec]`);
  console.log(`${chalk.italic("Language")}    :`, chalk.blueBright(result.pretty_lang!));
  console.log();

  if (result.status_msg! === "Runtime Error") {
    console.error(chalk.redBright("[ERROR] Runtime Error:", result.runtime_error!));
    console.log();
    return;
  }

  const StatusDisplay = (x: string) : string =>
    {
      if (x.includes('OK')) return chalk.greenBright(x);
      return chalk.redBright(x);
    }

  const table = new TablePrinter(undefined,
    ['OUTPUT', 'EXPECTED OUTPUT', 'TEST', 'STATUS'],
    [
      {size:  6, style: chalk.yellowBright},
      {size: 15, style: chalk.yellowBright},
      {size: 40, style: chalk.gray        },
      {size:  6, style: StatusDisplay     }
    ]
  );

  for (let i = 0; i < result.total_testcases!; i++) {
    const output = result.code_answer![i];
    const expected = result.expected_code_answer![i];
    const test = result.test_cases![i].replace('\n', ', ');
    const status = (output === expected) ? 'OK' : 'NO';
    table.pushRow(output, expected, test, status);
  }

  console.log(table.toString());
  console.log();
}

export const PrintSubmissionResults = (problem: types.DetailedQuestionData, submission: types.SubmissionResult) =>
{
  const failed = submission.total_correct! < submission.total_testcases!;
  const status = (failed) ? chalk.redBright("FAILED") : chalk.greenBright("SUCCESS");
  
  console.log();
  console.log(`Submission results for problem: ${chalk.bold(problem.title)}`);
  console.log();
  console.log(`${chalk.italic("Final Status")}  :`, status);
  console.log(`${chalk.italic("Submission Id")} :`, chalk.yellowBright(submission.submission_id!));
  console.log(`${chalk.italic("Runtime")}       :`, submission.status_runtime!);
  console.log(`${chalk.italic("Memory")}        :`, submission.status_memory!);
  console.log(`${chalk.italic("Finish Time")}   :`, TimestampToDate(submission.task_finish_time!));
  console.log(`${chalk.italic("Elased Time")}   : ${submission.elapsed_time! / 1e3} [sec]`);
  console.log(`${chalk.italic("Language")}      :`, chalk.blueBright(submission.pretty_lang!));
  console.log();

  if (submission.status_msg! === "Runtime Error") {
    console.error(chalk.redBright("[ERROR] Runtime Error:", submission.runtime_error!));
    console.log();
    return;
  }

  const table = new TablePrinter("Last Test Case",
    ['OUTPUT', 'EXPECTED', 'TEST CASE'],
    [
      {size: 20, style: chalk.yellowBright},
      {size: 20, style: chalk.yellowBright},
      {size: 40, style: chalk.gray        }
    ]
  );

  table.showLine = false;
  table.pushRow(submission.code_output!, submission.expected_output!, submission.last_testcase!);
  console.log(table.toString());
  console.log();

  const ShowsPerc = (x: number): string =>
    {
      if (x < 50) return chalk.redBright(x);
      if (x < 100) return chalk.rgb(255, 165, 0)(x);
      return chalk.greenBright(x);  
    } 

  const correct = submission.total_correct!;
  const total = submission.total_testcases!;
  const perc = correct/total*100;
  console.log(`${chalk.italic("Result")} : ${correct}/${total} (${ShowsPerc(perc)} %)`);
  console.log();
}