/**
 * @author Riccardo La Marca
 * 
 * @brief User-releated commands:
 * - login [Login into leetcode to start a session]
 * - inspect [Inspect the overall statistics of a user, or the current logged one]
 */

import { randomBytes } from 'crypto';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import * as types from '../types';
import * as utils from '../utils';
import constants from '../constants';
import Spinner from '../spinner';
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

const LoginCommand = async (_: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => 
{
  const spinner = new Spinner("User Logging in");
  spinner.start();

  try {
    await utils.OpenLoginBrowser(
      (r: HTTPResponse) => HandleResponse(state, r),
      HandleRequest
    );
    
  } catch (error) {
  }

  spinner.stop();

  if (state.userLogin) {
    const username = chalk.bold(state.userLogin.username);
    const success = chalk.greenBright("successfully");
    console.log(`User ${username} has ${success} logged.`);
  } else {
    console.log(chalk.red('User login has been stopped.'));
  }

  return state;
}

// Save command - Save the state into a json file
export const login_command: types.AppCommandData = {
  group    : 'User',
  name     : 'Login Command',
  command  : 'login',
  syntax   : /^login$/,
  callback : LoginCommand,

  help: 'login - Login into leetcode to start a session\n'
};