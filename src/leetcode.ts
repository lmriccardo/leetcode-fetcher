import * as types from './types'
import { HeadersInit, BodyInit } from 'undici-types'
import * as utils from './utils'
import queries from './queries'
import constants from './constants'
import chalk from 'chalk'

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

export const FetchProblemList = (variables: types.QueryVariables) 
  : Promise<types.ProblemsData | null> =>
{
  return createGraphQLFetcher(
    utils.FormatProblemsData, queries.problemset.problemsetQuestionList,
    constants.SITES.GRAPHQL.URL
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
  : Promise<types.RecentSubmissionList | null> =>
{
  return createGraphQLFetcher(
    (x: types.RecentSubmissionList) => x, queries.user.recentAcSubmissions,
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