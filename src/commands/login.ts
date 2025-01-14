import { randomBytes } from 'crypto';
import * as types from '../types';
import * as utils from '../utils';
import constants from '../constants';
import prompt from 'prompt';

const LoginCommand = async (_: string[], state: types.AppStateData)
  : Promise<types.AppStateData> => 
{
  try {
    prompt.start({noHandleSIGINT: true});
    prompt.message = "";

    const result = await prompt.get(constants.USER_PROMPT_SCHEMA);
    console.log(result);
    
    const username = result.username as string;
    const password = result.password as string;
    const salt = randomBytes(16).toString('hex');
    const hash_pawd = utils.HashPassword(password, salt);

    await utils.OpenLoginBrowser(username, password);

    state.userLogin = {username: username, password: hash_pawd, salt: salt};
    return state;
  } catch (err) {
    return state;
  }
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