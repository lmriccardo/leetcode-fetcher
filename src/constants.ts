import prompt from "prompt";

const constants = {
  ITERATIONS: 1000,
  KEY_LENGTH: 64,
  DIGEST: 'sha512',
  OUTPATH: "./problems",
  SITES : {
    LOGIN_PAGE: {
      URL: "https://leetcode.com/accounts/login/",
      INPUT_U: 'input#id_login.input__2o8B',
      INPUT_P: 'input#id_password.input__2o8B'
    }
  },
  USER_PROMPT_SCHEMA: {
    properties: {
      username: {
        required: true,
        description: 'Username',
        type: 'string'
      },
      password: {
        description: 'Password',
        required: true,
        hidden: true,
        replace: '*',
        type: 'string'
      }
    }
  } as prompt.Schema
}

export default constants;