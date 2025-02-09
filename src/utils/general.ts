import { readdir } from 'fs/promises';
import { join } from 'path';
import { pbkdf2Sync } from 'crypto';
import { FormatString } from './formatter';
import constants from '../constants';
import TurndownService from 'turndown'
import chalk from 'chalk';
import prompt from 'prompt';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as types from '../types';
import * as lc from '../leetcode';


/**
 * Returns a list of all existing problems in the output instance folder
 */
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

/**
 * Returns for each difficulty filter the corresponding number of problems
 */
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

/**
 * Converts the input HTML content into Markdown and save it into the corresponding path 
 */
const SaveHtmlToMarkdown = (path: fs.PathOrFileDescriptor, content: string) => {
  // Initialize turndown service and convert
  const markdown = (new TurndownService()).turndown(content);
  fs.writeFileSync(path, markdown);
}

/**
 * Sum all values belonging to the array and returns the result
 */
export const ArraySum = (...values: number[]): number => values.reduce((x, y) => x + y);

/**
 * Transpose the input matrix
 */
export const Transpose = <T>(matrix: T[][]) : T[][] => 
{
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))
}

/**
 * Converts the input timestamp into datetime format
 */
export const TimestampToDate = (timestamp: number) : string => (
  (new Date(timestamp * 1e3)).toLocaleString()
)

/**
 * Creates the question instance for the input problem data. In other words a new folder named 
 * <question-id>-<titleSlug> if created into the `output` input path. This new directory will
 * contains five files named: README.md, index.html, solution.py, tests.txt and hints.txt
 */
export const CreateQuestionInstance = (question: types.DetailedQuestionData | null, output?: string) => {
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
  const question_name = question.titleSlug;
  const question_id = question.questionFrontendId;
  const question_full_name = question_id.toString().concat("-", question_name);
  const question_folder = join(question_root_folder, question_full_name);
  const question_src = join(question_folder, "solution.py");
  const question_tests = join(question_folder, "tests.txt");
  const question_readme = join(question_folder, "README.md");
  const question_html = join(question_folder, "index.html");

  const question_tags = question.topicTags
      .map((value: types.QuestionTag) => value.name)
      .reduce((prev: string, curr: string) : string => {
        return prev + ", " + curr;
      });

  // Python header with some information about the problem
  const python_header = "\"\"\"\n" +
                        "QUESTION TITLE: " + question.title + "\n" +
                        "QUESTION LINK: "  + question.link + "\n" +
                        "QUESTION TAGS: "  + question_tags + "\n" +
                        "QUESTION LEVEL: " + question.difficulty + "\n" +
                        "\"\"\"";

  // Build the source code that will be written into the python file
  const source_code = "{0}\n\nfrom typing import *\n\n# SOLUTION STARTS\n{1}\n";

  // Take the correct code snippet (Python3)
  const code_snippet = question.codeSnippets
      .filter((value: types.CodeSnippet) => value.lang === 'Python3')
      .map((value: types.CodeSnippet) => value.code)[0] + "\n        ...";

  const full_source_code = FormatString(source_code, python_header, code_snippet);
  const tests = question.exampleTestcaseList
      .map((x: string): string => x.replace('\n', ',,'))
      .join('\n');

  // First we need to create the question folder (it should not exist)
  fs.mkdir(question_folder, 0o777, (err: NodeJS.ErrnoException | null) =>
    {
      if (err) console.error(chalk.redBright(`[ERROR] Operation not permitted: ${err}`));
    });

  // Write the README file using the conversion operation
  SaveHtmlToMarkdown(question_readme, question.content);

  // Save the source code content into the source file
  fs.writeFileSync(question_src, full_source_code);
  fs.writeFileSync(question_html, question.content);
  fs.writeFileSync(question_tests, tests);

  // Log the result
  console.log(chalk.greenBright(`[INFO] Result written in folder: ${question_folder}`));
}

/**
 * Hash the input password using the salt. It uses Password-Based Key Derivation Function v2.
 */
export const HashPassword = (password: string, salt: string) : string =>
{
  const iterations = constants.CRYPTO.ITERATIONS;
  const key_length = constants.CRYPTO.KEY_LENGTH;
  const digest = constants.CRYPTO.DIGEST;
  const hash = pbkdf2Sync(password, salt, iterations, key_length, digest);
  return hash.toString("hex");
}

/**
 * Checks that the input password and the input hash corresponds.
 */
export const VerifyPassword = (password: string, salt: string, original_hash: string) 
  : boolean =>
{
  return HashPassword(password, salt) === original_hash;
}

/**
 * Open the login browser for the `login` command
 */
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

/**
 * Shows a prompt where the user can insert the password and verifying if the input is correct or not.
 * It provides `constants.CRYPTO.AUTH_ATTEMPTS` attempts. 
 */
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

/**
 * Reads the solution from the solution.py file corresponding at the input question title
 */
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

/**
 * Reads the test cases from the tests.txt file corresponding at the input question title
 */
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

/**
 * Merges multiple input objects to construct an object of return type
 */
export const MergeStructures = <W extends Record<string,any>>(...itfs: Record<string,any>[]) : W =>
{
  return Object.assign({}, ...itfs) as W;
}