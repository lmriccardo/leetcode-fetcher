---
layout: default
title: Problems Commands
permalink: /commands/problems/
---

# Problems Commands Group 🧩

This group contains commands that are releated to LeetCode problems. In other words, all commands interacts with LeetCode in order to fetch, download and inspect specific problems. Must be noticed that, although LeetCode itself does not provide a public documented API, using simple tool like Web Developer on the Browser, Burpsuite or just searching online, it is possible to see how LeetCode itself is looking for problems and more over. In particular, all commands in this section use the [**GraphQL**](https://graphql.org/learn/) LeetCode endpoint:

```bash
https://leetcode.com/graphql
```

### GraphQL

Before moving deeply into the details of each different command, although it is not necessary, one should at least understand what's GraphQL. If you are not interested, just move on to the next section in the page. As they state, GraphQL is a *query* language for the API and a server-side runtime for executing queries using a type system the user should define. After a GraphQL service (server-side) is running (typically at a URL that ends with `/graphql`), it can receive GraphQL queries to validate and execute from clients. 

The GraphQL specification does not require particular client-server protocols when sending API requests and responses, but HTTP is the most common choice because of its ubiquity, and with LeetCode this is the case. An HTTP server, to be compatible with GraphQL, must be able to handle HTTP POST Requests for query and mutation operations (optionally also GET). A classical GraphQL POST request look like this:

```
POST /graphql HTTP/1.1
Host: https://leetcode.com
Accept: */*
Content-Type: application/json
<Other Headers ...>

<query>
```

Since the `Content-Type` header field is set to `application/json`, this means that the query would be a JSON-encoded body of the following form:

```json
{
  "query": "...",
  "operationName": "...",
  "variables": { "myVariable": "someValue", ... },
  "extensions": { "myExtension": "someValue", ... }
}
```

The `query` parameter is required and will contain the source text of a GraphQL document. Instead, the `operationName`, `variables` and `extensions` parameters are optional fields. Note that, if the `Content-Type` header is missing in the client's request, then the server will respond with a `4xx` status code. Using the GET method, the request will look different.

Once the server has received, validated and exected the GraphQL query, it will send an HTTP Response. The result of the query is returned in the body of the response in JSON format that will look like this:

```json
{
  "data": { ... },
  "errors": [ ... ],
  "extensions": { ... }
}
```

If no errors were returned, the `errors` field will not be present in the response body. On the other hand, if errors occurred before execution could start, the `errors` field will include these errors and the `data` field won't be present in the response. The two fields will be present in the response together in cases of *partial success*, for example setting `data` to `null` and `errors` to corresponding value. In this last case, HTTP Status Code of `2xx` is obtained.

This is all about GraphQL, for what's we are interested in. Now, let's step to the commands.

## 1. List command

**Syntax**: `list`

The `list` command extracts a list of problems from LeetCode and save it locally in the application state. At this stage, no local instance is yet created, however fetched problems are present in the application "memory" ready to be *downloaded*. 

This is the corresponding GraphQL query:

```graphql
#graphql
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      acRate
      difficulty
      freqBar
      questionFrontendId
      isFavor
      paidOnly: isPaidOnly
      status
      title
      titleSlug
      topicTags {
        name
        id
        slug
      }
      hasSolution
      hasVideoSolution
    }
  }
}
```

As you might see from the above query, it takes as *input* (variables, as named by GraphQL) four parameters. The `$categorySlug` parameter filters the returned problem list by the category, e.g., `"algorithms"`. The `$limit` parameter limits the number of problems that we obtain from the query. The `$skip` parameter, instead, specify how many number of problems to skip before fetching the result. Finally, the `$filters` variable represents other filters for example the difficulty, problem tags or company. 

An example of HTTP POST Request body could be:

```json
{
    "query": "<above query>",
    "variables": { 
        "categorySlug": "algorithm", 
        "limit": 100, 
        "skip": 20,
        "filters": {"difficulty": "EASY"}
    }
}
```

Here is an output example when running the `list` command:

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): list
```

![List Command Output]({{site.baseurl}}/assets/images/list_command.png){:.center}

At the top filters are specified, then total number of problems for the given category and total number of fetched problems are displayed and, finally, the problem list is printed in a table formatted way. As you can see there are six main columns: *STATUS*, *IDX*, *ID*, *DIFFICULTY*, *TITLE* and *TAGS*. The content of the last four columns it is enough esplicative I think, thus let's talk about the first two.

The **Status** column display some useful informations about the state of the problem. In particular, it identifies if the problem has already been solved by the currently logged in user (if any) using ❌ as "No" and ✅ as "Yes", if the solution is public (🙉) or premium only (🙈) and, if the video solution is available (📹).

> In the current version, i.e., `v0.1.1`, the status column does not show an information, i.e., if the corresponding problem is already beeing downloaded or not locally. In positive cases the emoji 🔗 should appear.
{:.bug}

The **Idx** column display the index of the corresponding problem in the application problem list. That is, this column contains the local indexing for the respective problem, while the **Id** column represents the remote ID, or more specifically the *Frontend ID* of the problem (which is actually different from the question ID, although sometimes they match). 

> Fetched problems are saved into the current state of the application. This means that to see which problem is available to be downloaded, it is sufficient to inspect the state, instead of resubmitting the `list` command everytime. 
{:.info}

## 2. Fetch command

## 3. Detail command

## 4. Create command

## 5. Daily command