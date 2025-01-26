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

const ToShortSubmission = async (submissions: types.SubmissionData[], state: types.AppStateData) 
  : Promise<types.SubmissionList> =>
{
  let headers = utils.FormatCookies(state.cookies);
  
  if (!headers) {
    console.warn(chalk.yellowBright("To fetch submission details a session must exists."));
  }

  const submission_list = await Promise.all(submissions.map(
      async (x: types.SubmissionData) : Promise<types.ShortSubmission> =>
      {
        const short_data = await FetchShortSubmissionDetail({submissionId: x.id}, headers);
        return {...x, ...short_data!};
      }
    )
  );

  return {submissionList: submission_list};
}

export const GetUserData = async (username: string, state: types.AppStateData) : Promise<types.User | undefined> =>
{
  const spinner = new Spinner(`Fetching User ${username} profile`);
  spinner.start();

  const variables = {username: username};
  const user_profile = await FetchUserProfile(variables)

  // Check that the provided user exists
  if (user_profile?.matchedUser === null) {
    spinner.stop();
    console.error(chalk.redBright(utils.FormatString(
      "User {0} does not exists", chalk.bold(username))));

    return undefined;
  }

  const lang_stats = await FetchUserLanguageStats(variables);
  const recent_submissions = await FetchUserRecentSubmissions(variables);
  const recent_ac_submissions = await FetchUserRecentAcSubmissions(
    {...variables, limit: -1});

  spinner.changeMessage(`Fetching User ${username} submissions`);
  const short_ac_submission = await ToShortSubmission(recent_ac_submissions?.recentAcSubmissionList!, state);
  const short_submission = await ToShortSubmission(recent_submissions?.recentSubmissionList!, state);

  spinner.stop();

  // Construct the user type with the fetched informations
  return utils.FormatUserData(user_profile!, lang_stats!, short_submission, short_ac_submission);
}

export const FetchLeetcode = async (url: string, method: string, headers: HeadersInit, body?: BodyInit)
  : Promise<Response | null> =>
{
  try {
    // Sends a post request to the graphql endpoint of leetcode
    const response = await fetch(url, 
      { method: method,  headers: headers,  credentials: "include",  body: (body ?? null) }
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
    await new Promise(resolve => {setTimeout(resolve, 2000);});
  }

  return false;
}

const FormatSubmissionRequest = (problem: types.SingleQuestionData, 
  cookies: types.LeetcodeSessionCookies, folder: string, test: boolean) : [HeadersInit?, BodyInit?, string?] =>
{
  const problem_id = problem.question.questionId;
  const problem_frontend_id = problem.question.questionFrontendId;
  const problem_title = problem.question.titleSlug;
  const f_cookies = utils.FormatCookies(cookies);
  
  const request_headers = {
    ...constants.SITES.GENERIC_HEADERS,
    ...f_cookies,
    Referer: `https://leetcode.com/problems/${problem_title}/`,
    Origin: 'https://leetcode.com',
    "Content-Type": 'application/json',
    "x-csrftoken": cookies.csrftoken!
  };

  const solution = utils.ReadProblemSolution(folder, problem_frontend_id, problem_title);
  if (!solution) return [undefined, undefined, undefined];
  
  const request_body: {[key: string]: any} = 
    { lang: "python3", question_id: problem_id.toString(), typed_code: solution };

  if (test) {
    const test_cases = utils.ReadProblemTestCases(folder, problem_frontend_id, problem_title);
    if (!test_cases) return [undefined, undefined, undefined];
    request_body.data_input = test_cases.join('\n');
  }
  
  const request_body_str = JSON.stringify(request_body);

  const url_prefix = `https://leetcode.com/problems/${problem_title}`;
  const request_url = (test) ? `${url_prefix}/interpret_solution/` : `${url_prefix}/submit/`;

  return [request_headers, request_body_str, request_url];
}

const WaitForResults = async <T extends types.GenericSubmitStatus>(id: string, headers: HeadersInit): Promise<T|null> =>
{
  const result_url = `https://leetcode.com/submissions/detail/${id}/check/`;
  let json_result;

  do {

    const results = await FetchLeetcode(result_url, 'GET', headers);
    if (!(results && results.ok && results.status === 200)){
      console.error(chalk.redBright(`Check request terminated with status code: ${results!.status}`));
      return null;
    }
    json_result = await results.json() as T;
    await new Promise(resolve => {setTimeout(resolve, 100);});
    
  } while (json_result.state !== 'SUCCESS');

  return json_result;
}

const RunSolution = async <T extends types.GenericSubmitStatus>(
  state: types.AppStateData, msg: string, test: boolean) : Promise<T | null> =>
{
  const spinner = new Spinner(msg);
  spinner.start();

  const root_folder = state.variables["FOLDER"].value as string;
  const [ request_headers, request_body, url ] = FormatSubmissionRequest(
    state.watchQuestion!, state.cookies!, root_folder, test);

  if (!request_headers || !request_body || !url) {
    spinner.stop();
    return null;
  }

  console.log(url, request_body);
  const response = await FetchLeetcode(url, 'POST', request_headers, request_body);

  if (!(response && response.ok && response.status === 200)){
    spinner.stop();
    console.error(chalk.redBright(`Test request terminated with status code: ${response!.status}`));
    return null;
  }

  spinner.changeMessage("Waiting for results");

  const response_data = await response.json() as {[key: string]: string};
  const request_id = (test) ? response_data.interpret_id : response_data.submission_id;
  
  const json_result = await WaitForResults<T>(request_id, request_headers);
  if (!json_result) return null;

  spinner.stop();
  return json_result;
}

export const TestSolution = async (state: types.AppStateData) : Promise<types.TestStatus | null> =>
{
  const result = await RunSolution<types.TestStatus>(state, "Submitting Test", true);
  if (result) {
    const folder = state.variables["FOLDER"].value as string;
    const problem_id = state.watchQuestion?.question.questionFrontendId!;
    const problem_title = state.watchQuestion?.question.titleSlug!;
    result.test_cases = utils.ReadProblemTestCases(folder, problem_id, problem_title)!;
  }
  return result;
}

export const SubmitSolution = async (state: types.AppStateData) 
  : Promise<types.SubmissionResult | null> => 
{
  const submission_result = await RunSolution<types.SubmitStatus>(state, "Submitting Solution", false);
  if (!submission_result) return null;

  const spinner = new Spinner(`Fetching submission Id ${submission_result.submission_id} details`);
  spinner.start();
  
  const f_cookies = utils.FormatCookies(state.cookies!);
  const submission_details = await FetchSubmissionDetail(
    {submissionId: submission_result?.submission_id}, {...f_cookies}
  );

  spinner.stop();
  return {...submission_result, ...submission_details};
}