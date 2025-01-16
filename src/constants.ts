import prompt from "prompt";

const constants = {
  CRYPTO: {
    ITERATIONS: 1000,
    KEY_LENGTH: 64,
    DIGEST: 'sha512'
  },
  OUTPATH: "./problems",
  SITES : {
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
  COMMANDS: {
    GROUPS: ['Generic', 'Problems', 'State', 'User']
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