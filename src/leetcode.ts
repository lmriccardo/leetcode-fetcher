import * as types from './types'
import { HeadersInit, BodyInit } from 'undici-types'
import * as utils from './utils'
import queries from './queries'
import constants from './constants'
import chalk from 'chalk'
import { Spinner } from './pprint'

export const FetchGraphQLData = async <T, U>(
  variables: types.QueryVariables, formatData: (data: T) => U, query: string, 
  headers: HeadersInit, url: string) : Promise<U | null> =>
{
  try {
    // Sends a post request to the graphql endpoint of leetcode
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query, variables }),
    });

    // Obtain the json response representation
    const result = await response.json() as { data: T };
    return formatData(result.data);

  } catch (error) {
    console.error("Error when fetching question:", error);
    return null;
  }
}

const createGraphQLFetcher = <T, U>(
  formatData: (data: T) => U,
  query: string,
  url: string,
  headers?: HeadersInit
) => {
  return (variables: types.QueryVariables): Promise<U | null> => {
    return FetchGraphQLData(variables, formatData, query, 
      {...(headers ?? {Referer: 'https://leetcode.com'}), }, url);
  };
};

export const FetchNumberOfProblems = async (difficulty: string) : Promise<number | null> =>
{
  return createGraphQLFetcher(
    (data: types.ProblemsetQuestionListData) => data.problemsetQuestionList.total,
    queries.problemset.problemsetQuestionList, constants.SITES.GRAPHQL.URL
  )(
    {
      categorySlug: "",
      limit: 1,
      skip: 0,
      filters: {difficulty}
    }
  )
}

export const FetchProblemList = (variables: types.QueryVariables, header?: HeadersInit) 
  : Promise<types.ProblemsData | null> =>
{
  return createGraphQLFetcher(
    utils.FormatProblemsData, queries.problemset.problemsetQuestionList,
    constants.SITES.GRAPHQL.URL, header
  )(variables);
}

export const FetchQuestion = async (variables: types.QueryVariables) 
  : Promise<types.SingleQuestionData | null> =>
{
  return createGraphQLFetcher(
    utils.FormatQuestionData, queries.problemset.selectProblem,
    constants.SITES.GRAPHQL.URL
  )(variables);
}

export const FetchDailyQuestion = async () : Promise<types.DailyQuestion | null> => 
{
  return createGraphQLFetcher((x: types.DailyQuestion) => x, 
    queries.problemset.questionOfToday, constants.SITES.GRAPHQL.URL
  )({});
}

export const FetchUserProfile = async (vars: types.QueryVariables, headers?: HeadersInit) 
  : Promise<types.MatchedUser | null> =>
{
  return createGraphQLFetcher(
    (x: types.MatchedUser) => x, queries.user.userPublicProfile,
    constants.SITES.GRAPHQL.URL, headers
  )(vars)
}

export const FetchUserLanguageStats = async (vars: types.QueryVariables, headers?: HeadersInit)
  : Promise<types.UserLanguageStats | null> =>
{
  return createGraphQLFetcher(
    (x: types.UserLanguageStats) => x, queries.user.languageStats,
    constants.SITES.GRAPHQL.URL, headers
  )(vars);
}

export const FetchUserRecentSubmissions = async (vars: types.QueryVariables, headers?: HeadersInit)
  : Promise<types.RecentSubmissionList | null> =>
{
  return createGraphQLFetcher(
    (x: types.RecentSubmissionList) => x, queries.user.recentSubmissions,
    constants.SITES.GRAPHQL.URL, headers
  )(vars);
}

export const FetchUserRecentAcSubmissions = async (vars: types.QueryVariables, headers?: HeadersInit)
  : Promise<types.RecentAcSubmissionList | null> =>
{
  return createGraphQLFetcher(
    (x: types.RecentAcSubmissionList) => x, queries.user.recentAcSubmissions,
    constants.SITES.GRAPHQL.URL, headers
  )(vars);
}

export const FetchSubmissionDetail = async (vars: types.QueryVariables, headers?: HeadersInit)
  : Promise<types.SubmissionDetails | null> =>
{
  return createGraphQLFetcher(
    (x: types.SubmissionDetails) => x, queries.solveql.submissionDetails,
    constants.SITES.GRAPHQL.URL, headers
  )(vars);
}

export const FetchShortSubmissionDetail = async (vars: types.QueryVariables, headers?: HeadersInit)
  : Promise<types.ShortSubmissionDetailsData | null> =>
{
  return createGraphQLFetcher(
    utils.FormatShortSubmissionDetails, queries.solveql.submissionDetails,
    constants.SITES.GRAPHQL.URL, headers
  )(vars);
}

export const FetchLeetcode = async (url: string, method: string, headers: HeadersInit, body?: BodyInit)
  : Promise<Response | null> =>
{
  try {
    // Sends a post request to the graphql endpoint of leetcode
    const response = await fetch(url, 
      {
        method: method, 
        headers: headers, 
        credentials: "include", 
        body: (body ?? null)
      }
    );

    return response;

  } catch (error) {
    console.error(chalk.redBright(`Error when fetching leetcode URL: ${error}`));
    return null;
  }
}

export const CheckUserSession = async (cookies: types.LeetcodeSessionCookies) 
  : Promise<boolean> => 
{
  for (let i = 0; i < constants.SITES.CONNECTION_ATTEMPT; i++)
  {
    const cookie_s = `LEETCODE_SESSION=${cookies.LEETCODE_SESSION!}; ` +
    `csrftoken=${cookies.csrftoken!};`;

    const response = await FetchLeetcode(constants.SITES.PROBLEMSET_PAGE.URL, 
      "GET", {...constants.SITES.GENERIC_HEADERS, "Cookie" : cookie_s}
    );
    
    if (response && response.ok && response.status === 200) return true;

    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  }

  return false;
}

export const TestSolution = async (state: types.AppStateData)
  : Promise<types.TestStatus | null> =>
{
  const problem = state.watchQuestion!;
  const problem_title = problem.question.titleSlug;
  const problem_id = state.watchQuestionId!;
  const cookies = utils.FormatCookies(state.cookies);

  const request_headers = {
    ...constants.SITES.GENERIC_HEADERS,
    ...cookies,
    Referer: `https://leetcode.com/problems/${problem_title}/`,
    Origin: 'https://leetcode.com',
    "Content-Type": 'application/json',
    "x-csrftoken": state.cookies!.csrftoken!
  };

  const test_cases = problem.question.exampleTestcaseList.join("\n");
  const problem_root_folder = state.variables["FOLDER"].value as string;
  const solution = utils.ReadProblemSolution(problem_root_folder, problem_id, problem_title);
  const request_body = JSON.stringify(
    {
      lang: "python3",
      question_id: problem_id.toString(),
      typed_code: solution,
      data_input: test_cases
    }
  );  

  const url = `https://leetcode.com/problems/${problem_title}/interpret_solution/`;
  const response = await FetchLeetcode(url, 'POST', request_headers, request_body);

  if (!(response && response.ok && response.status === 200)){
    console.error(chalk.redBright(`Test request terminated with status code: ${response!.status}`));
    return null;
  }

  const response_data = await response.json() as {interpret_id: string, test_case: string};
  const request_id = response_data.interpret_id;
  
  const spinner = new Spinner("Waiting for results");
  spinner.start();
  
  const result_url = `https://leetcode.com/submissions/detail/${request_id}/check/`;

  let json_result;

  do {

    const results = await FetchLeetcode(result_url, 'GET', request_headers);
    if (!(results && results.ok && results.status === 200)){
      console.error(chalk.redBright(`Check request terminated with status code: ${response!.status}`));
      return null;
    }
    json_result = await results.json() as types.TestStatus;
    await new Promise(resolve => {setTimeout(resolve, 100);});
    
  } while (json_result.state !== 'SUCCESS');
  
  spinner.stop();
  json_result.test_cases = problem.question.exampleTestcaseList;
  return json_result;
}