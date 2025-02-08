---
layout: default
title: State Commands
permalink: /commands/state/
---

# State Commands Group 🍪

The `State` group is a collection of commands releated to interact with the *state* of the application. 

### The State

> In version `v0.2.0` there will be an entire refactoring of the application state and how it is visualized through the `show` command. However, it is still not available, thus consider reading this page carefully. Moreover, the general architecture will remain the same. This means that this section of the documentation is still *under development*, i.e., something might change or might not. 
{:.info}

It represents the memory or the cache of LeetCode Fetcher. In other words, anything that could be considered useful in the near future is stored in this so-called *state*. Useful informations includes: fetched problems, user information (username, hashed password, salt and session cookies), daily question, filters and other variables. In general, it is diveded into two parts: (1) what can be modified by the application and (2) what is modifidable directly (not as a result of a command) by the user. The second section entirely consists of so-called *variables*, that we have already mentioned in the [Problem Group]({{site.baseurl}}/commands/problems) page.

## 1. Show command

**Syntax:** `show [SENSITIVE]`

The `show` command is used to print out some informations contained into the application state. However, by default sensitive informations like the username, password and session cookies are not displayed. Thus, the `SENSITIVE` option parameter is used to enable the *shadowed* section as a result of a successful password verification. That is, a password will be asked to the user and tested with respect to the one stored into the state.

**It is the same password the user provided to log into LeetCode**

> If the state does not contain any information about the user then, adding or not the `SENSITIVE` parameter wont change the output.
{:.info}

Here is an output example, without the sensitive section (for obvious reasons):

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): show
```

![Show Command Output]({{site.baseurl}}/assets/images/show_command.png)

As you can see from the output, the two sections are clearly identifiable. At the top there is the `STATE INFORMATION` section that contains: last executed command, logged-in user, last *watched* question and the list of all fetched problems. At the bottom, instead, there is the `VARIABLES` section that, as you might already know, contains: all the filters, the output folder and a new option called `SAVE_LOGIN`. It is a boolean option that if set to 1 enables user informations to be saved into the JSON file, when the `save` command is executed.

> I personally don't like how the state is displayed, it is just a messy of informations. In the next release, i.e., `v0.2.0` this will change. Moreover, I would also like to add subcommands like `show problems`, `show user`, `show variables` and so on, in order to obtain a more structured output.
{:.info}

> There is a problem when listing all problems. If a user submit a solution with a final result equal to `SUCCESS`, the status of the problem will not change in the application state. To update it, the user should re-fetch the entire problem list (since using the `fetch` command results into an "an already existing" output). This is not optimal, as you might understand.
{:.bug}

## 2. Set command

**Syntax:** `set VARN1 VARV1 ...`

The `set` command interacts with the `VARIABLES` section of the application state. In particular it sets the value of specified variable `VARNi` (Variable Name i-th) to `VARVi` (Variable Value i-th). Notice that the variable name and value *must be placed contiguously* in the command, this means that the following `set name1 name2 value1 value2` is prohibited, while `set name1 value1 name2 value2` is the correct one.

Variables for which values can be sets are:

|   **Name**     |   **Default** | **Range**                |
|:--------------:|:-------------:|:------------------------:|
|    _CATEGORY_  |    algorithms |      algorithms      |
|      _LIMIT_   |        20     |      -1,1...Inf      |
|      _SKIP_    |        0      |        0...Inf       |
|   _DIFFICULTY_ |       ALL     | Easy,Medium,Hard,All |
|     _FOLDER_   |    ./problems |     any valid path     |
|   _SAVE_LOGIN_ |        0      |          0,1         |

Here is the description for each of them:

- `CATEGORY` represents the category filter
- `LIMIT` represents the maximum number of problems to fetch
- `SKIP` represents the number of problems to skip before start fetching
- `DIFFICULTY` if the difficulty filter
- `FOLDER` indicates the output folder to the `create` command
- `SAVE_LOGIN` if set to true, user credentials and session are saved into the JSON file

The following example illustrates how to customly fetch problems and create instances:

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): set LIMIT 100 SKIP 20 DIFFICULTY Easy
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): list
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): set FOLDER ../problems/easy
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): create
```

Explanation of the above sequence of commands:

1. Changes the filters to fetch 100 easy problems starting from the 21-st
2. Fetches the list of all problems
3. Changes the output folder to `../problems/easy`
4. For each fetched problem an instance is created in the specified folder

> When using the `set` command to change the values of multiple variables the order matter. What does it means? It means that the order in which the variables appears in the command **must** be the same of the above table, otherwise it might not work properly.
{:.warning}

## 3. Unset command

**Syntax:** `unset VARN1 ...`

The `unset` command changes back the value of input variables to their default values.

> Also in this case, just like the `set` command, the order in which variables appear is important and cannot be ignored. 
{:.warning}

## 4. Save command

**Syntax:** `save PATH(.json)`

The `save` command is used to store the entire, or partial, content of the application state into the input JSON `PATH`. In general, by default, most of state informations are stored into the JSON, except for the user informations. Option that can be enabled by setting the `SAVE_LOGIN` variable to `1` (True). If this is the case, before actually saving the content a password matching verification is performed. 

You can think of a running instance of the application like a new and clean temporary session. By saving its state, it will be possible to load the saved *session* into another running instance and continue what was left. 

The content of the JSON file will look like the following:

```json
{
    "lastCommand": "set SAVE_LOGIN 1", // Or any other command
    "lastSelectedProblems": {
        "totalQuestions": 3051,        // Or any other value
        "count": 20,                   // N. Fetched problems (can vary)
        "problemsetQuestionList": []   // The list of all problems
    },
    "lastQuestion": null,              // The last fetched question
    "selectedUser": "<username>",      // The logged-in username
    "userLogin": {                     // Optional informations about the user (SAVE_LOGIN 1)
        "username": "<username>",      
        "password": "<hashed password>",
        "salt": "<salt>"
    },
    "profile": { ... },                 // The User profile
    "cookies": {                        // The Session cookies (SAVE_LOGIN 1)
        "csrftoken": "<token>",
        "messages": "<value>",
        "LEETCODE_SESSION": "<value>"
    },
    "variables": [                      // All the variables
        {
            "name": "<name>", 
            "value": "<value>"
        },
        ...
    ]
}
```

One, and maybe the most useful, use case is to solve the [`login` command problem]({{site.baseurl}}/commands/user#1-login-command), by saving LeetCode Session cookies for later use.

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): login
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): set SAVE_LOGIN 1
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): save state.json
```

## 5. Load command

**Syntax:** `load PATH(.json)`

The `load` command is used to load into the current LeetCode Fetcher "session" a saved application state identified by the `PATH` argument. 

> When loading a state into the current session, it will overwrite all existing modifications with those saved into the JSON. For this reason it is suggested to load when first the application start. 
{:.warning}

If the provided path exists then the state will be loaded, otherwise an error will be displayed.

> Notice that, the `load` command will not require the password verification step in the case user sensitive information are stored into the JSON file. The reason is very simple: if a generic user has access to the file, then it can easily retrieve the plain text password using hash cracking techniques (since also the *salt* is provided).
{:.info}