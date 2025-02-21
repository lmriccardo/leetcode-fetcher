<h1 align="center">LeetCode Problem Fetcher</h1>
<div align="center">

### A CLi Application for local fetching of leetcode problems

<img src="https://img.shields.io/badge/License-MIT-green.svg"/>
<img src="https://img.shields.io/npm/v/npm.svg?logo=nodedotjs"/>
<img src="https://img.shields.io/github/v/release/lmriccardo/leetcode-fetcher"/>
<img src="https://img.shields.io/npm/dm/leetcode-fetcher-cli?&logo=npm"/>
<img src="https://img.shields.io/github/downloads/lmriccardo/leetcode-fetcher/total?logo=github
"/>
<img src="https://img.shields.io/docker/pulls/lmriccardo/leetcode-fetcher?logo=docker"/>

![LeetCode](https://img.shields.io/badge/LeetCode-000000?style=for-the-badge&logo=LeetCode&logoColor=#d16c06)
![Node.js](https://img.shields.io/badge/Node.js-%2320232a?style=for-the-badge&logo=node.js&logoColor=43853D)
![TypeScript](https://img.shields.io/badge/typetscript-%2320232a.svg?style=for-the-badge&logo=typescript&logoColor=%fff)

<p><strong>NPM Package</strong>: <a href="https://www.npmjs.com/package/leetcode-fetcher-cli">https://www.npmjs.com/package/leetcode-fetcher-cli</a></p>
<p><strong>Docker Repository</strong>: <a href="https://hub.docker.com/repository/docker/lmriccardo/leetcode-fetcher/general">https://hub.docker.com/repository/docker/lmriccardo/leetcode-fetcher/general</a></p>

<p><strong>Current Version</strong>: v0.1.1 (Release), v0.1.2 (Development)</p>

</div>

---

> _GitHub Pages_ Documentation is in construction 👷
>
> Give a look to [TODO.md](./TODO.md) for upcoming changes

---

## About ✨

When solving leetcode problems, I would have like to have a tool or a utility able to automatically provides me with a number of problems and, for each of them, creates a local instance with the problem description and the provided snippet of code. Thus avoiding every time to manually copy everything locally, resolve the imports and setup the tests.

The final result of this need is **leetcode-fetcher**, a simple cli applications that interacts with leetcode through the *GraphQL* endpoint, in order to fetch problems, user statistics, run tests remotely and submit a solution.

## Running the App 🚀

### Cloning the repository and install locally

Up to now, to run the application you need first to clone the repository, install all the required node modules and then run. 

```
git clone https://github.com/lmriccardo/leetcode-fetcher.git
npm install && npm run app
```

Please, make sure to have node.js and npm installed in your system.

### Using Docker containers

Alternatively, it is possible to run the application using Docker.

```
docker run --rm -it -v ./:/leetcode lmriccardo/leetcode-fetcher:latest
```

Notice that, the bind mount `-v ./:/leetcode` is **required** to obtain the result on the host machine. When the application starts, the first command to execute must be

```
set FOLDER /leetcode
```

In order to set the correct output folder

> **NOTE**: Within Docker containers, user login with browser is not available. The only possible solution is to
> load a pre-saved JSON state with a logged in user. 

### From NPM Packages

The last way to run the cli application is to install it via *npm*

```
npm i leetcode-fetcher-cli
```

The command to run the application is just 

```
lcfetcher
```

## How the application works 💻

When first the application starts, the following line will appear:

```
[Current DateTime] >> (Type help for commands): 
```

If you type `help` the list with all possible commands will appear. That is, the application works giving specific commands and then pressing ENTER to execute it. Every time, either an error or the output pops out, you will always see the initial line and new commands can be given. Here is the list with all possible commands:

| **Name**  | **Syntax**                      | **Description**                                                                                                                                                               |
|-----------|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| _Help_    | `help [cmd1 cmd2 ...]`          | Shows the helper message for each given command. If no command is provided, consider all.                                                                                     |
| _Set_     | `set [VAR value ...]`           | Set the value of the specified variable. To inspect available variables use the `show` command.                                                                               |
| _Unset_   | `unset [VAR1 VAR2 ...]`         | Unset variables bringing back to their default values.                                                                                                                        |
| _Show_    | `show [sensitive]`              | Shows values and informations about the application state and variables. If sensitive is given then also user cookies are shown.                                              |
| _List_    | `list`                          | Locally fetches a number of problems from leetcode. The search is filtered using the _variables_ set with `set` or `unset`                                                    |
| _Detail_  | `detail idx` | Print details about a specified problem. A problem is specified either by local indexing, or remote question IDs.                                                             |
| _Fetch_   | `fetch <title\|id> value`      | Fetch locally a single problem from remote. The problem is specified either using the title-slug or the remote ID.                                                            |
| _Create_  | `create <idx>`                  | Create a problem instance in the provided target folder (which is a variable). The problem is specified only by the local index which means that must already exists locally. |
| _Save_    | `save filepath`                 | Saves the current state into a json file                                                                                                                                      |
| _Load_    | `load filepath`                 | Loads the state from a json file                                                                                                                                              |
| _Clear_   | `clear`                         | Clears the screen content                                                                                                                                                     |
| _Login_   | `login [force]`                 | Open a browser to perform the login and starts a leetcode session.                                                                                                            |
| _Inspect_ | `inspect [username]`            | Inspect a given user profile if it exists, or the current logged one                                                                                                          |
| _Daily_   | `daily [create]`                | Fetch the current daily question and optionally create an instance                                                                                                            |
| _Quit_    | `quit`                          | Quit the application                                                                                                                                                          |
| _Watch_   | `watch <question-idx\|daily>`   | Cache the given problem for future tests or submissions. An instance of the given problem is create if it does not exists.                                                    |
| _Test_    | `test`                          | Test the cached problem with leetcode remotely (see `watch`)                                                                                                                  |
| _Submit_  | `submit`                        | Submit a solution of the cached problem in leetcode (see `watch`)                                                                                                             |

In order to obtain more informations about the commands, run the `help` command.

An output example is already present in the <a href="./examples/python/9-palindrome-number">./examples/python/9-palindrome-number</a> folder. It has been obtained running the following commands:

```
[XXX] >> (Type help for commands): fetch id 9

Fetched Problems : 1

STATUS  IDX  ID  DIFFICULTY        TITLE        TAGS

 ❌🙉💲   0   9      Easy     Palindrome Number  Math

[XXX] >> (Type help for commands): set FOLDER ./examples/python
[XXX] >> (Type help for commands): create 0
[INFO] Result written in folder: examples\python\9-palindrome-number
```

## Current Limitations and futures 🚧

- Up to now, the only possible target language to save the problem code snippet is Python3.