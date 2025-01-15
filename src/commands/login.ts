import { randomBytes } from 'crypto';
import { HTTPResponse } from 'puppeteer';
import * as types from '../types';
import * as utils from '../utils';
import constants from '../constants';

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

    const headers = response.headers();
    const matches = headers['set-cookie'].matchAll(/([\w_]+)=(.*?)(?=\s|$)/g);
    console.log(matches);
    console.log(headers['set-cookie']);
  }
}

const LoginCommand = async (_: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => 
{
  await utils.OpenLoginBrowser((r: HTTPResponse) => HandleResponse(state, r));
  return state;
}

// Save command - Save the state into a json file
const login_command: types.AppCommandData = {
  name: 'Login Command',
  command: 'login',
  syntax: /^login$/,
  callback: LoginCommand,

  help: 'login - Login into leetcode to start a session\n'
}

export default login_command;