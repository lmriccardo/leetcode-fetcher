import prompt from "prompt";
import * as types from './types'
import chalk from "chalk";

const constants = {
  CRYPTO: {
    ITERATIONS: 1000,
    KEY_LENGTH: 64,
    DIGEST: 'sha512',
    AUTH_ATTEMPTS: 3
  },
  OUTPATH: "./problems",
  DIFFICULTIES: ["EASY", "MEDIUM", "HARD"],
  SITES : {
    CONNECTION_ATTEMPT: 3,
    LOGIN_PAGE: {
      URL: "https://leetcode.com/accounts/login/",
      INPUT_U: 'input#id_login.input__2o8B',
      INPUT_P: 'input#id_password.input__2o8B'
    },
    HOME_PAGE: {
      URL: 'https://leetcode.com/',
      REDIRECT: {
        status: 200,
        contentType: 'text/html',
        body: ""
      }
    },
    PROBLEMSET_PAGE : {
      URL: 'https://leetcode.com/problemset/'
    },
    GRAPHQL : {
      URL: 'https://leetcode.com/graphql'
    },
    GENERIC_HEADERS : {
      "Accept": "*/*",
      "Accept-Encoding" : "gzip, deflate, br, zstd",
      "Accept-Language" : "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
      "Connection" : "keep-alive",
      "Cache-Control": "no-cache",
    }
  },
  PROMPT: {
    VALIDATION_SCHEMA: {
      properties: {
        password: {
          description: 'Password',
          required: true,
          hidden: true,
          replace: '*',
          type: 'string'
        }
      }
    } as prompt.Schema
  },
  // Thanks to: https://github.com/sindresorhus/cli-spinners/blob/HEAD/spinners.json
  SPINNER: {
    BOUNCING_BALL: {
      INTERVAL: 80,
      FRAMES: [
        "(●     )",
        "( ●    )",
        "(  ●   )",
        "(   ●  )",
        "(    ● )",
        "(     ●)",
        "(    ● )",
        "(   ●  )",
        "(  ●   )",
        "( ●    )"
      ]
    },
    DOTS: {
		  INTERVAL: 80,
		  FRAMES: [
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏"
      ]
    },
  },
  APP : {
    TITLE: `██╗      ██████╗ ███████╗███████╗████████╗ ██████╗██╗  ██╗███████╗██████╗ \n` +
           `██║     ██╔════╝ ██╔════╝██╔════╝╚══██╔══╝██╔════╝██║  ██║██╔════╝██╔══██╗\n` +
           `██║     ██║█████╗█████╗  █████╗     ██║   ██║     ███████║█████╗  ██████╔╝\n` +
           `██║     ██║╚════╝██╔══╝  ██╔══╝     ██║   ██║     ██╔══██║██╔══╝  ██╔══██╗\n` +
           `███████╗╚██████╗ ██║     ███████╗   ██║   ╚██████╗██║  ██║███████╗██║  ██║\n` +
           `╚══════╝ ╚═════╝ ╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`,
    SUBTITLE: 'A CLi Application for leetcode interaction',
    COMMANDS: {
      GROUPS: ['Generic', 'Problems', 'State', 'User']
    },
    APP_VARIABLES: {
      CATEGORY : { 
        name    : 'CATEGORY', 
        match   : 'CATEGORY\\s(\\w+)', 
        value   : "algorithms", 
        default : "algorithms", 
        type    : "s",
        desc    : 'The category filter when listing problems',
        values  : '[algorithms]' 
      },
      LIMIT : {
        name    : 'LIMIT', 
        match   : 'LIMIT\\s(\\-?\\d+)',
        value   : 20, 
        default : 20, 
        type    : "n",
        desc    : 'Maximum number of problems to list',
        values  : '[-1,1...Inf]'
      },
      SKIP : {
        name    : 'SKIP', 
        match   : 'SKIP\\s(\\d+)', 
        value   : 0, 
        default : 0, 
        type    : "n",
        desc    : 'Skip a number of initial problems',
        values  : '[1...Inf]'
      },
      DIFFICULTY : {
        name    : 'DIFFICULTY', 
        match   : 'DIFFICULTY\\s(\\w+)', 
        value   : "ALL", 
        default : "ALL", 
        type    : "s",
        desc    : 'The difficulty selection',
        values  : '[Easy, Medium, Hard, All]'
      },
      FOLDER : {
        name    : 'FOLDER', 
        match   : 'FOLDER\\s([\\w\\./-]+)', 
        value   : './problems', 
        default : "./problems", 
        type    : "s",
        desc    : 'The output folder where problems will be created',
        values  : 'Any folder name'
      },
      SAVE_LOGIN : {
        name    : 'SAVE_LOGIN',
        match   : 'SAVE\\_LOGIN\\s(1|0)',
        value   : 0,
        default : 0,
        type    : 'n',
        desc    : 'If true, user credentials and session saved into the json',
        values  : '[0,1]'
      }
    } as types.Variables,
    LIST_QUERY_VARIABLES: ['CATEGORY', 'LIMIT', 'SKIP', 'DIFFICULTY'],
    DIFFICULTY_STYLE: (x: string) : string => {
      if (x.includes('E')) return chalk.greenBright(x);
      if (x.includes('M')) return chalk.rgb(255, 165, 0)(x);
      return chalk.redBright(x);
    },
    SHORT_SUBMISSION: {
      COLS: ['ID', 'Title', 'Question ID', 'Timestamp', 'Language', 'Runtime', 'Memory'],
      STYLES: [
        chalk.yellowBright, undefined, chalk.yellowBright, 
        chalk.cyanBright, chalk.magentaBright, chalk.greenBright, 
        chalk.greenBright
      ],
      JUST: [0, -1, 0, 0, 0, 0, 0]
    },
    EMOJIS: {
      CHECK: '✅',
      WRONG: '❌',
      DOWNLOADED: '🔗',
      NOT_FREE: '🙈',
      FREE: '🙉',
      HAS_VIDEO: '📹'
    }
  }
}

constants.SITES.HOME_PAGE.REDIRECT.body = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Successful</title>
  <style>
    body {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh; /* Full viewport height */
      margin: 0; /* Remove default margin */
      font-family: Arial, sans-serif; /* Set a default font */
      background-color: #f9f9f9; /* Light background color */
    }

    h1 {
      margin: 0; /* Remove default margin */
      color: #4CAF50; /* Green color for title */
    }

    p {
      margin: 10px 0 0; /* Margin for paragraph */
      color: #555; /* Dark gray for content */
      font-size: 18px; /* Font size for content */
    }
  </style>
</head>
<body>
  <h1>Login Successful</h1>
  <p>You can now close the browser to continue.</p>
</body>
</html>
`

export default constants;