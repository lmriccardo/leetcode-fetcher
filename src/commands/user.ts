/**
 * @author Riccardo La Marca
 * 
 * @brief User-releated commands:
 * - login   [Login into leetcode to start a session]
 * - inspect [Inspect the overall statistics of a user, or the current logged one]
 */

import { randomBytes } from 'crypto';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import * as types from '../types';
import * as utils from '../utils';
import * as lc from '../leetcode';
import constants from '../constants';
import { Spinner } from '../pprint';
import chalk from 'chalk';

const HandleResponse = async (state: types.AppStateData, response: HTTPResponse) =>
{
  if (response.url().startsWith(constants.SITES.LOGIN_PAGE.URL))
  {
    const request = response.request(); // Get the corresponding request

    // We dont want the navigation request since most likely it would
    // be the naviagation request we have done when opening the page.
    // Moreover, we also need the response to be successful and the
    // request to be a POST request, thus with POST data.
    if (request.isNavigationRequest() || !request.hasPostData() || !response.ok()) return;

    // Get the username and the password provided and compute the hash
    const result = await response.json();
    const username = result.form.fields.login.value;
    const password = result.form.fields.password.value;
    const salt = randomBytes(16).toString('hex');
    const hash_pawd = utils.HashPassword(password, salt);

    state.userLogin = {username: username, password: hash_pawd, salt: salt};
    state.selectedUser = username;

    const headers = response.headers();
    const matches = headers['set-cookie'].matchAll(/^([\w_]+)=([^;]+)/gm);
    state.cookies = { csrftoken: "", messages: "", LEETCODE_SESSION: "" };
    Array.from(matches).forEach((value: RegExpExecArray) => {
      state.cookies![value[1] as keyof types.LeetcodeSessionCookies] = value[2];
    });
  }
}

const HandleRequest = async (request: HTTPRequest) =>
{
  if (request.isInterceptResolutionHandled()) return;
  if (request.url() !== constants.SITES.HOME_PAGE.URL) {
    request.continue();
    return;
  }

  request.respond(constants.SITES.HOME_PAGE.REDIRECT);
}

const CheckUserSession = async (spinner: Spinner, state: types.AppStateData)
  : Promise<void> =>
{
  if (state.userLogin !== undefined && state.cookies !== undefined) {
    spinner.changeMessage("Session found. Checking validity");
    spinner.start();
    const result = await lc.CheckUserSession(state.cookies);
    spinner.stop();
    
    if (result) {
      console.log(utils.FormatString("\rThe current {0} is still {1}!",
        chalk.bold("session"), chalk.greenBright("active")
      ));
    } else {
      state.userLogin = undefined;
      state.cookies = undefined;
    }
  }
}

const GetUserData = async (username: string) : Promise<types.User | undefined> =>
{
  const spinner = new Spinner(`Fetching User ${username} profile`);
  spinner.start();

  const variables = {username: username};
  const user_profile = await lc.FetchUserProfile(variables)

  // Check that the provided user exists
  if (user_profile?.matchedUser === null) {
    spinner.stop();
    console.error(chalk.redBright(utils.FormatString(
      "User {0} does not exists", chalk.bold(username))));

    return undefined;
  }

  const lang_stats = await lc.FetchUserLanguageStats(variables);
  const recent_submissions = await lc.FetchUserRecentSubmissions(variables);
  const recent_ac_submissions = await lc.FetchUserRecentAcSubmissions(
    {...variables, limit: -1});

  spinner.stop();

  // Construct the user type with the fetched informations
  return {
    profile: {
      username: user_profile!.matchedUser.username,
      realName: user_profile!.matchedUser.profile.realName,
      aboutMe: user_profile!.matchedUser.profile.aboutMe,
      reputation: user_profile!.matchedUser.profile.reputation,
      ranking: user_profile!.matchedUser.profile.ranking,
      githubUrl: user_profile!.matchedUser.githubUrl,
      twitterUrl: user_profile!.matchedUser.twitterUrl,
      linkedinUrl: user_profile!.matchedUser.linkedinUrl,
      websites: user_profile!.matchedUser.profile.websites,
      skillTags: user_profile!.matchedUser.profile.skillTags
    },
    submitStats: user_profile!.matchedUser.submitStats,
    langStats: lang_stats!.matchedUser.languageProblemCount,
    subList: recent_submissions!,
    acSubList: recent_ac_submissions!
  }
}

const LoginCommand = async (_: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => 
{
  const spinner = new Spinner("User Logging in");
  CheckUserSession(spinner, state);

  if (!state.userLogin) {
    spinner.changeMessage("User Logging in");
    spinner.start();

    try {
      await utils.OpenLoginBrowser(
        (r: HTTPResponse) => HandleResponse(state, r),
        HandleRequest
      );
      
    } catch (error) {
    }

    spinner.stop();
  }

  if (!state.userLogin) {
    console.log(chalk.red('User login has been stopped.'));
    return state;
  }

  const username = chalk.bold(state.userLogin.username);
  const success = chalk.greenBright("successfully");
  console.log(`User ${username} has ${success} logged.`);

  // Fetch user details
  const user_data = await GetUserData(state.userLogin.username!);
  state.profile = user_data;

  return state;
}

// Login command - Login into leetcode to start a session
export const login_command: types.AppCommandData = {
  group    : 'User',
  name     : 'Login Command',
  command  : 'login',
  syntax   : /^login$/,
  callback : LoginCommand,

  help: 'login - Login into leetcode to start a session\n'
};

const InspectCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> =>
{
  if (data.length < 1) {
    console.error(chalk.redBright("A username must be provided."));
    return state;
  }

  await GetUserData(data[0]);

  return state;
}

// Inspect command - Inspect a user
export const inspect_command: types.AppCommandData = {
  group    : 'User',
  name     : 'Inspect Command',
  command  : 'inspect',
  syntax   : /^inspect\s(.*?)$/,
  callback : InspectCommand,

  help: 'inspect USERNAME - Inspect a given username if it exists.\n'
};