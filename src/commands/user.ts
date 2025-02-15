/**
 * @author Riccardo La Marca
 * 
 * @brief User-releated commands:
 * - login   [Login into leetcode to start a session]
 * - inspect [Inspect the overall statistics of a user, or the current logged one]
 */

import { hash, randomBytes } from 'crypto';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import { Spinner } from '../pprint';
import { HashPassword, OpenLoginBrowser } from '../utils/general';
import { FormatString } from '../utils/formatter';
import { PrintUserSummary } from '../utils/printer';
import * as types from '../types';
import * as lc from '../leetcode';
import constants from '../constants';
import chalk from 'chalk';

const HandleResponse = async (state: types.AppStateData, response: HTTPResponse) =>
{
  // Classical login through LeetCode
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
    const hash_pawd = HashPassword(password, salt);

    state.userLogin = {username: username, password: hash_pawd, salt: salt};
    state.selectedUser = username;

    const headers = response.headers();
    const matches = headers['set-cookie'].matchAll(/^([\w_]+)=([^;]+)/gm);
    state.cookies = { csrftoken: "", messages: "", LEETCODE_SESSION: "" };
    Array.from(matches).forEach((value: RegExpExecArray) => {
      state.cookies![value[1] as keyof types.LeetcodeSessionCookies] = value[2];
    });
    return;
  }

  // Login using Github
  if (response.url().startsWith(constants.SITES.THIRD_PARTY.GITHUB.SESSION)) {
    const response_status_code = response.status();
    const request = response.request();
    
    // If the response is not a redirect or the request has no post data
    if (response_status_code !== 302 || !request.hasPostData()) return;

    const request_post_data = request.postData();
    const params = new URLSearchParams(request_post_data);
    
    // From the (key, value) pairs select those corresponding to username and password
    let content: {[key: string]: string} = {};
    for (const [key, value] of params.entries()) {
      if (["login", "password"].includes(key)) {
        content[key] = value;
      }
    }
    
    // Creates the salt and hash the password
    const salt = randomBytes(16).toString('hex');
    const hash_pwd = HashPassword(content.password, salt);
    state.userLogin ={username: content.login, password: hash_pwd, salt: salt};
    state.selectedUser = content.login;

    return;
  }

  if (response.url().startsWith(constants.SITES.THIRD_PARTY.GITHUB.CALLBACK)) {
    const headers = response.headers();

    const matches = headers['set-cookie'].matchAll(/^([\w_]+)=([^;]+)/gm);
    state.cookies = { csrftoken: "", messages: "", LEETCODE_SESSION: "" };
    Array.from(matches).forEach((value: RegExpExecArray) => {
      state.cookies![value[1] as keyof types.LeetcodeSessionCookies] = value[2];
    });

    return;
  }

  // Some other methods goes here ...
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
      console.log(FormatString("\rThe current {0} is still {1}!",
        chalk.bold("session"), chalk.greenBright("active")
      ));
    } else {
      state.userLogin = undefined;
      state.cookies = undefined;
    }
  }
}

const LoginCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => 
{
  const spinner = new Spinner("User Logging in");
  const forced = data[0] !== undefined;
  if (!forced) await CheckUserSession(spinner, state);
  else {
    console.warn(chalk.yellowBright("[WARNING] Login has been forced. No check on current session."));
  }

  if (!(state.userLogin && state.cookies) || forced) {
    spinner.changeMessage("User Logging in");
    spinner.start();

    try {
      await OpenLoginBrowser(
        (r: HTTPResponse) => HandleResponse(state, r),
        HandleRequest
      );
      
    } catch (error) {
    }

    spinner.stop();
  }

  if (!(state.userLogin && state.cookies)) {
    console.log(chalk.red('User login has been stopped.'));
    state.userLogin = undefined;
    state.cookies = undefined;
    return state;
  }

  const username = chalk.bold(state.userLogin.username);
  const success = chalk.greenBright("successfully");
  console.log(`User ${username} has ${success} logged.`);

  // Fetch user details
  const user_data = await lc.GetUserData(state.userLogin.username!, state);
  state.profile = user_data;

  if (user_data) PrintUserSummary(user_data);

  return state;
}

// Login command - Login into leetcode to start a session
export const login_command: types.AppCommandData = {
  group    : 'User',
  name     : 'Login Command',
  command  : 'login',
  syntax   : /^login(?:\s+(force))?$/,
  callback : LoginCommand,

  help: 'login [force] - Login into leetcode to start a session. `force` parameter\n' +
        'forces the application to attempt the login instead of checking the\n'       +
        'current session validity (if any).'
};

const InspectCommand = async (data: string[], state: types.AppStateData)
  : Promise<types.AppStateData> =>
{
  if (data.length < 1) {
    // Check if a user is logged
    if (!state.selectedUser) {
      console.error(chalk.redBright("No current logged user. A username must be provided."));
      return state;
    }

    data = [state.selectedUser];
  }

  const result = await lc.GetUserData(data[0], state);
  if (result) PrintUserSummary(result);

  return state;
}

// Inspect command - Inspect a user
export const inspect_command: types.AppCommandData = {
  group    : 'User',
  name     : 'Inspect Command',
  command  : 'inspect',
  syntax   : /^inspect(?:\s(.*?))$/,
  callback : InspectCommand,

  help: 'inspect [USERNAME] - Inspect a given username if it exists' +
        ', or the current logged one.\n'
};