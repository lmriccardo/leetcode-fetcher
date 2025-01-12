import { readdir } from 'fs/promises';
import { join } from 'path';
import TurndownService from 'turndown'
import * as fs from 'fs';
import * as types from './types'

const OUTPATH : string = "./problems/"; // Define the output folder of the problem instance

export const GetExistingProblems = async (): Promise<string[] | null> => {
  try {
    var result: string[] | null = null;

    const files = await readdir("./problems", { withFileTypes: true });
    result = files.map((value: fs.Dirent): string => {
      return value.name.split("-")[0];
    });

    return result;

  } catch (error) {
    console.error("Error reading folder: ", error);
    return null;
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

const SaveHtmlToMarkdown = (path: fs.PathOrFileDescriptor, content: string) => {
  // Initialize turndown service and convert
  const markdown = (new TurndownService()).turndown(content);
  fs.writeFileSync(path, markdown);
}

export const FormatString = (template: string, ...args: any[]): string => {
  return template.replace(/{(\d+)}/g, (match, index) => args[index] || "");
}

export const CreateQuestionInstance = (question: types.SingleQuestionData | null, output?: string) => {
  // Check if the input data is null
  if (question === null) {
    console.error("Impossible to create problem instance. Input is null.");
    return;
  }

  const question_root_folder = output || OUTPATH;

  // Create also the root folder if it does not exists
  if (!fs.existsSync(question_root_folder)) {
    if (fs.mkdirSync(question_root_folder, { recursive: true }) === undefined) {
      console.error(`Impossible to create root folder: ${question_root_folder}`);
      return;
    }
  }

  // Create the problem folder name and file name
  const question_name = question.question.titleSlug;
  const question_id = question.question.questionFrontendId;
  const question_full_name = question_id.toString().concat("-", question_name);
  const question_folder = join(question_root_folder, question_full_name);
  const question_src = join(question_folder, "solution.py");
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
  const source_code = "{0}\n\nfrom typing import *\n\n# SOLUTION STARTS\n{1}\n\n# TESTS\n{2}\n";

  // Take the correct code snippet (Python3)
  const code_snippet = question.question.codeSnippets
      .filter((value: types.CodeSnippetData) => value.lang === 'Python3')
      .map((value: types.CodeSnippetData) => value.code)[0] + "\n        ...";

  // Define a regular expression to match the function definition 
  const functionRegex = /def\s+(\w+)\s*\(/;
  const match = code_snippet.match(functionRegex);
  const function_name = match![1];
  const tests = question.question.exampleTestcaseList
      .map((value: string) : string => {
        return FormatString("print(Solution().{0}({1}))", function_name, value.replace("\n", ","));
      })
      .reduce((prev: string, curr: string) : string => {
        return prev + "\n" + curr
      });

  const full_source_code = FormatString(source_code, python_header, code_snippet, tests);

  // First we need to create the question folder (it should not exist)
  fs.mkdir(question_folder, 0o700, (err: NodeJS.ErrnoException | null) =>
    {
      if (err) console.error("Operation not permitted: ", err);
    });

  // Write the README file using the conversion operation
  SaveHtmlToMarkdown(question_readme, question.question.content);

  // Save the source code content into the source file
  fs.writeFileSync(question_src, full_source_code);
  fs.writeFileSync(question_html, question.question.content);

  // Log the result
  console.log("Result written in folder:", question_folder);
}

export const PrintProblemsSummary = (problems: types.ProblemsData) => {
  console.log("Total Problems:", problems.totalQuestions);
  console.log("Fetched Problems:", problems.count);
  problems.problemsetQuestionList.forEach(
    (value: types.QuestionGenericData, idx: number) => {
      const tags = value.topicTags
        .map((value: types.QuestionTag) : string => value.name)
        .reduce((p: string, c: string) : string => p + ", " + c);

      const format_str = 
        `[${idx}] <ID=${value.questionFrontendId}> (${value.difficulty}) ` +
        `${value.title.toUpperCase()} [${tags}]`;
        
      console.log(format_str);
    })
}

export const PrintQuestionSummary = (question: types.SingleQuestionData) => {
  console.log(FormatString("Last Question: { ID={0}, TitleSlug={1}, Link={2} }",
    question.question.questionFrontendId, question.question.titleSlug, question.link
  ));
}