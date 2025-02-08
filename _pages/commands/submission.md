---
layout: default
title: Submissions Commands
permalink: /commands/submissions/
---

# Submissions Commands Group 📤

The *Submissions* group contains several commands releated to LeetCode Question submissions and tests. Differently from previous commands, all of them interacts with LeetCode through its REST API. Except for the `submit` command which also uses a GraphQL query to fetch some other details about the current submission. There are three main LeetCode endpoints for the REST API:

1. `https://leetcode.com/problems/{title-slug}/interpret_solution/`
2. `https://leetcode.com/problems/{title-slug}/submit/`
3. `https://leetcode.com/submissions/detail/{submission-id}/check/`

> Before running any of the following command make sure you have already logged into LeetCode using the [`login` command]({{site.baseurl}}/commands/user#1-login-command), except for the `watch` command. **This is a required step**.
{:.warning}

> When modifying the solution in the `solution.py` file, please make sure that the entirety of the solution is written in the given method of the `Solution` class, otherwise errors might occur. Obviously, you can creates new methods or functions, but **does not move** the solution method (which is the only method already present when opening the file). Any solution must be in the format (for example Python)
> ```python
> from typing import *
> # other imports
> 
> class Solution:
>     # Here you can create new methods, functions and so on
>     def primaryMethod(inputs) -> type:
>         return result
```
{:.info}

## 1. Watch command

**Syntax:** `watch <question-idx|daily>`

Before running any test or submission, the `watch` command must be given. It "caches" the given problem for future tests or submissions. By "caching" I mean, it saves it into the application state. The problem can be specified in two ways: (1) by local indexing, or (2) daily. Obviously, the given index must exists, otherwise an error is returned. Notice that, if the given problem has been fetched but it does not yet have an associated local instance, it will be asked to the user to create one by answering `"Y"`.

## 2. Test command

**Syntax:** `test`

After successfully ran the `watch` command, the user is now enabled to test its current solution remotely on the test cases provided by LeetCode. It uses the first and third REST API endpoint respectively for: (1) requesting a test on the provided solution and (2) gather the results. For this reason the `test` command execution, as well as the `submit` command, is divided into two steps:

- Test request submission, performed using a HTTP POST Request in the form

```http
POST /problems/{title-slug}/interpret_solution/ HTTP/1.1
Host: leetcode.com
Content-Type: application/json
Accept: */*
Referer: https://leetcode.com/problems/{title-slug}/
Origin: https://leetcode.com
Cookie: LEETCODE_SESSION=<value>; csrftoken=<value>
x-csrftoken: <csrftoken>

{
  "lang": "python3",
  "question_id": "{id}",
  "typed_code": "{solution}",
  "data_input": "{test-cases}"
}
```

with response body:

```json
{
    "interpret_id": "<the-id>"
}
```

- Results fetching, performed using a HTTP GET Request in the form

```http
GET /submissions/detail/{interpret-id}/check/ HTTP/1.1
Host: leetcode.com
Referer:  https://leetcode.com/problems/{title-slug}/submissions
Content-Type: application/json
Cookie: LEETCODE_SESSION=<value>; csrftoken=<value>
x-csrftoken: <csrftoken>
```

Since the test might take a long time or it has been queued for execution, we need to wait a while before fetching the results. When they are available, a log will be visible in the application. As an example, consider the problem named [*Add Two Numbers*](https://leetcode.com/problems/add-two-numbers). In order to test a solution:

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): login
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): fetch NAME add-two-numbers
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): watch 0
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): test
```

with output:

![Test Command Output]({{site.baseurl}}/assets/images/test_command.png){:.center}{:.resized-img}

> The `Finish Time` does not make any sense ... Must be fixed.
{:.bug}

Skipping all the upper informations such as question name, total runtime and consumed memory, language and so on, in the bottom part there is a table indicating which of the provided test cases has successfully passed or not. Indeed it is possible to provide more test cases by modifying the created `tests.txt` file in the LeetCode problem instance, which should look like this (for this problem at least):

```
[2,4,3],,[5,6,4]
[0],,[0]
[9,9,9,9,9,9,9],,[9,9,9,9]
```

Notice that, when the objective function takes as input multiple parameters, in the test file arguments **must** be delimited by `,,` symbol. This is not a LeetCode restriction, it is just the way in which LeetCode Fetcher parses the file. Hence, adding lines is equivalent to add test cases for our solution. 

> It may happens that sometimes the submission takes to long to complete either for a server-side problem, or because our solution is taking too much runtime. It can also happens that the submission requests is taking too long to reach LeetCode servers. In this case, an error raises and the application exit. This is obvioulsy not intended, and must be fixed.
{:.bug}

Finally, if any server-side runtime errors occur, the error is returned in the response and logged into the application.

## 3. Submit command

**Syntax:** `submit`

If you are sure your solution might works, you can try to submit it using the `submit` command. Differently from the previous command, it uses the second and third REST API endpoint, respectively for: (2) submitting the solution and (3) obtaining the results. However, just like the `test` command its execution is divided into two steps (the same steps, just using a different POST request):

- Submission request, an HTTP POST Request in the form:

```http
POST /problems/{title-slug}/submit/ HTTP/1.1
Host: leetcode.com
Content-Type: application/json
Accept: */*
Referer: https://leetcode.com/problems/{title-slug}/
Origin: https://leetcode.com
Cookie: LEETCODE_SESSION=<value>; csrftoken=<value>
x-csrftoken: <csrftoken>

{
  "lang": "python3",
  "question_id": "{id}",
  "typed_code": "{solution}"
}
```

withe response body:

```json
{
  "submission_id": "<id>"
}
```

- Results fetching, using the same HTTP GET Request and changing the `interpret_id` with the `submission_id`.

Consider the same *Add Two Numbers* problem, a `submit` command output would be:

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): submit
```

![Submit Command Output]({{site.baseurl}}/assets/images/submit_command.png){:.center}

In the output you can see, along with the usual informations like runtime, memory, final status and so on, also the last failed test case. In case the final status is `SUCCESS` then there wont be any.

> Some other informations are missing, put planned to be added.
{:.warning}