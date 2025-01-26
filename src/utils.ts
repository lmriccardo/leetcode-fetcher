import { readdir } from 'fs/promises';
import { join } from 'path';
import { pbkdf2Sync } from 'crypto';
import { TablePrinter, RectangleBox } from './pprint';
import TurndownService from 'turndown'
import constants from './constants';
import puppeteer from 'puppeteer';
import prompt from 'prompt';
import chalk from 'chalk';
import * as fs from 'fs';
import * as types from './types'
import * as lc from './leetcode'

export const GetExistingProblems = async (problem_folder: string): Promise<number[]> => {
  try {
    var result: number[] = [];

    if (!fs.existsSync(problem_folder)) return [];

    const files = await readdir(problem_folder, { withFileTypes: true });
    result = files.map((value: fs.Dirent): number => {
      return Number.parseInt(value.name.split("-")[0]);
    });

    return result;

  } catch (error) {
    console.error("Error reading folder: ", error);
    return [];
  }
}

export const FormatQuestionData = (data: types.SelectProblemData)
  : types.SingleQuestionData => (
  {
    link: `https://leetcode.com/problems/` + data.question.titleSlug,
    question: {
      isPaidOnly: data.question.isPaidOnly,
      questionId: data.question.questionId,
      questionFrontendId: data.question.questionFrontendId,
      title: data.question.title,
      titleSlug: data.question.titleSlug,
      difficulty: data.question.difficulty,
      content: data.question.content,
      exampleTestcaseList: data.question.exampleTestcaseList,
      topicTags: data.question.topicTags,
      companyTagStats: data.question.companyTagStats,
      hints: data.question.hints,
      solution: data.question.solution,
      codeSnippets: data.question.codeSnippets,
      status: data.question.status
    },
  }
)

export const FormatProblemsData = (data: types.ProblemsetQuestionListData) 
  : types.ProblemsData => (
  {
    totalQuestions: data.problemsetQuestionList.total,
    count: data.problemsetQuestionList.questions.length,
    problemsetQuestionList: data.problemsetQuestionList.questions,
  }
);

export const FormatUserData = (user: types.MatchedUser, lstats: types.UserLanguageStats,
  subList: types.SubmissionList, acSubList: types.SubmissionList) : types.User => (
  {
    link: `https://leetcode.com/u/${user!.matchedUser.username}`,
    profile: {
      username: user!.matchedUser.username,
      realName: user!.matchedUser.profile.realName,
      aboutMe: user!.matchedUser.profile.aboutMe,
      reputation: user!.matchedUser.profile.reputation,
      ranking: user!.matchedUser.profile.ranking,
      githubUrl: user!.matchedUser.githubUrl,
      twitterUrl: user!.matchedUser.twitterUrl,
      linkedinUrl: user!.matchedUser.linkedinUrl,
      websites: user!.matchedUser.profile.websites,
      skillTags: user!.matchedUser.profile.skillTags
    },
    submitStats: user!.matchedUser.submitStats,
    langStats: lstats!.matchedUser.languageProblemCount,
    subList: subList,
    acSubList: acSubList
  }
)

export const FormatShortSubmissionDetails = (details: types.SubmissionDetails)
  : types.ShortSubmissionDetailsData =>
(
  {
    runtimeDisplay: details.submissionDetails?.runtimeDisplay,
    memoryDisplay: details.submissionDetails?.memoryDisplay,
    question: details.submissionDetails?.question,
    lang: details.submissionDetails?.lang
  }
);

export const FormatCookies = (cookies?: types.LeetcodeSessionCookies) : {Cookie: string} | undefined => {
  if (!cookies) return undefined;

  const cookie_s = `LEETCODE_SESSION=${cookies.LEETCODE_SESSION!}; ` +
      `csrftoken=${cookies.csrftoken!};`;

  return {"Cookie": cookie_s};
}

export const GetAllProblemsCount = async (): Promise<types.ProblemsCount> => 
(
  (await Promise.all(
      constants.DIFFICULTIES.map(async (x): Promise<types.ProblemsCount> => {
        const nproblems = await lc.FetchNumberOfProblems(x);
        return {[x]: nproblems ?? 0};
      })
    )
  ).reduce((p, c) => ({...p,...c}))
)

const SaveHtmlToMarkdown = (path: fs.PathOrFileDescriptor, content: string) => {
  // Initialize turndown service and convert
  const markdown = (new TurndownService()).turndown(content);
  fs.writeFileSync(path, markdown);
}

export const FormatString = (template: string, ...args: any[]): string => {
  return template.replace(/{(\d+)}/g, (_, index) => args[index] || "");
}

export const ArraySum = (...values: number[]): number => values.reduce((x, y) => x + y);

export const Transpose = <T>(matrix: T[][]) : T[][] => 
{
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))
}

const CenterString = (str: string, width: number): string =>
{
  // Calculate the total padding required
  const padding = width - str.length;

  // If the string is already wider than the desired width, return the original string
  if (padding <= 0) {
      return str;
  }

  // Calculate left and right padding
  const leftPadding = Math.floor(padding / 2);
  const rightPadding = Math.ceil(padding / 2);

  // Return the centered string
  return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
}

export const JustifyString = (str: string, width: number, dir: number): string =>
{
  if (dir == 0) return CenterString(str, width); // Center the string

  const remaining_size = (width - str.length) > 0;
  if (dir == -1) return str + ((remaining_size) ? ' '.repeat(width - str.length) : '');
  if (dir == 1) return ((remaining_size) ? ' '.repeat(width - str.length) : '') + str;
  return str;
}

export const TimestampToDate = (timestamp: number) : string => (
  (new Date(timestamp * 100)).toLocaleString()
)

export const CreateQuestionInstance = (question: types.SingleQuestionData | null, output?: string) => {
  // Check if the input data is null
  if (question === null) {
    console.error(chalk.redBright("[ERROR] Impossible to create problem instance. Input is null."));
    return;
  }

  const question_root_folder = output || constants.OUTPATH;

  // Create also the root folder if it does not exists
  if (!fs.existsSync(question_root_folder)) {
    if (fs.mkdirSync(question_root_folder, { recursive: true }) === undefined) {
      console.error(chalk.redBright(`[ERROR] Impossible to create root folder: ${question_root_folder}`));
      return;
    }
  }

  // Create the problem folder name and file name
  const question_name = question.question.titleSlug;
  const question_id = question.question.questionFrontendId;
  const question_full_name = question_id.toString().concat("-", question_name);
  const question_folder = join(question_root_folder, question_full_name);
  const question_src = join(question_folder, "solution.py");
  const question_tests = join(question_folder, "tests.txt");
  const question_readme = join(question_folder, "README.md");
  const question_html = join(question_folder, "index.html");

  const question_tags = question.question.topicTags
      .map((value: types.QuestionTag) => value.name)
      .reduce((prev: string, curr: string) : string => {
        return prev + ", " + curr;
      });

  // Python header with some information about the problem
  const python_header = "\"\"\"\n" +
                        "QUESTION TITLE: " + question.question.title + "\n" +
                        "QUESTION LINK: "  + question.link + "\n" +
                        "QUESTION TAGS: "  + question_tags + "\n" +
                        "QUESTION LEVEL: " + question.question.difficulty + "\n" +
                        "\"\"\"";

  // Build the source code that will be written into the python file
  const source_code = "{0}\n\nfrom typing import *\n\n# SOLUTION STARTS\n{1}\n";

  // Take the correct code snippet (Python3)
  const code_snippet = question.question.codeSnippets
      .filter((value: types.CodeSnippetData) => value.lang === 'Python3')
      .map((value: types.CodeSnippetData) => value.code)[0] + "\n        ...";

  const full_source_code = FormatString(source_code, python_header, code_snippet);
  const tests = question.question.exampleTestcaseList
      .map((x: string): string => x.replace('\n', ',,'))
      .join('\n');

  // First we need to create the question folder (it should not exist)
  fs.mkdir(question_folder, 0o777, (err: NodeJS.ErrnoException | null) =>
    {
      if (err) console.error(chalk.redBright(`[ERROR] Operation not permitted: ${err}`));
    });

  // Write the README file using the conversion operation
  SaveHtmlToMarkdown(question_readme, question.question.content);

  // Save the source code content into the source file
  fs.writeFileSync(question_src, full_source_code);
  fs.writeFileSync(question_html, question.question.content);
  fs.writeFileSync(question_tests, tests);

  // Log the result
  console.log(chalk.greenBright(`[INFO] Result written in folder: ${question_folder}`));
}

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

export const PrintProblemsSummary = async (problems: types.ProblemsData, vars: types.Variables) => {

  console.log("Total Problems   :", problems.totalQuestions);
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

  problems.problemsetQuestionList.forEach(
    (value: types.QuestionGenericData, idx: number) => {
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
      if (value.isPaidOnly) {
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

export const PrintQuestionSummary = (question: types.SingleQuestionData) => {
  console.log(FormatString("Last Question: { ID={0}, TitleSlug={1}, Link={2} }",
    question.question.questionFrontendId, question.question.titleSlug, question.link
  ));
}

export const HashPassword = (password: string, salt: string) : string =>
{
  const iterations = constants.CRYPTO.ITERATIONS;
  const key_length = constants.CRYPTO.KEY_LENGTH;
  const digest = constants.CRYPTO.DIGEST;
  const hash = pbkdf2Sync(password, salt, iterations, key_length, digest);
  return hash.toString("hex");
}

export const VerifyPassword = (password: string, salt: string, original_hash: string) 
  : boolean =>
{
  return HashPassword(password, salt) === original_hash;
}

export const OpenLoginBrowser = async (res_cb: types.HttpResponseCallBack, req_cb: types.HttpRequestCallBack) 
  : Promise<void> =>
{
  const browser = await puppeteer.launch({headless: false, args: ['--window-size=1080,1024']});
  const page = await browser.newPage();

  page.setRequestInterception(true);
  page.on('response', res_cb);
  page.on('request', req_cb);

  await page.goto(constants.SITES.LOGIN_PAGE.URL, {waitUntil: 'load'});
  page.setViewport({width: 1080, height: 1024});

  // Wait until the browser is not closed
  await new Promise((resolve) => {
    browser.on('disconnected', resolve);
  })
}

export const RequestPassword = async (credentials: types.UserLoginData) 
  : Promise<boolean> =>
{
  let attemps = constants.CRYPTO.AUTH_ATTEMPTS;
  prompt.message = '';
  prompt.delimiter = '';

  while (attemps > 0) {
    try {
      prompt.start({noHandleSIGINT: true});
      const { password } = await prompt.get(constants.PROMPT.VALIDATION_SCHEMA);
      const validation_result = VerifyPassword(
        password as string, credentials.salt!, credentials.password!)
      
      if (validation_result) return true;
    } catch (error) {
    }

    console.error(chalk.redBright("[ERROR] Wrong Password. Retry."))
    attemps--;
  }

  return false;
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

export const ReadProblemSolution = (folder: string, problem_id: number, problem_title: string)
  : string | null =>
{
  if (!fs.existsSync(folder)) {
    console.error(chalk.redBright(`[ERROR] ${folder} does not exists.`));
    return null;
  }

  try {
    const problem_file = join(folder, `${problem_id}-${problem_title}`, 'solution.py');
    const content = fs.readFileSync(problem_file, {encoding: 'utf-8'});

    // Split the string using the line terminator character
    const lines = content.split('\n');
    const final_lines = [];
    for (const line of lines) {
      if (line.includes('TESTS')) break;
      final_lines.push(line);
    }

    return final_lines.join('\n');
  } catch (error) {
    console.error(chalk.redBright("[ERROR]", error));
    return null;
  }
}

export const ReadProblemTestCases = (folder: string, problem_id: number, problem_title: string)
  : string[] | null =>
{
  if (!fs.existsSync(folder)) {
    console.error(chalk.redBright(`[ERROR] ${folder} does not exists.`));
    return null;
  }

  try {
    const test_file = join(folder, `${problem_id}-${problem_title}`, 'tests.txt');
    const content = fs.readFileSync(test_file, {encoding: 'utf-8'});
    const lines = content.split('\n');
    return lines.map((x): string => x.replace(',,', '\n'));
  } catch (error) {
    console.error(chalk.redBright("[ERROR]", error));
    return null;
  }
}

export const PrintTestDetails = (problem: types.SingleQuestionData, result: types.TestStatus) => 
{
  console.log();
  console.log(`Test results for problem: ${chalk.bold(problem.question.title)}`);
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

export const PrintSubmissionResults = (problem: types.SingleQuestionData, submission: types.SubmissionResult) =>
{
  const failed = submission.total_correct! < submission.total_testcases!;
  const status = (failed) ? chalk.redBright("FAILED") : chalk.greenBright("SUCCESS");
  
  console.log();
  console.log(`Submission results for problem: ${chalk.bold(problem.question.title)}`);
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