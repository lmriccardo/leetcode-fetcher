---
layout: default
title: User Commands
permalink: /commands/user/
---

# User Commands Group 👤

The *User* commands group is a collection of commands releated with LeetCode user interaction, for example, creating new sessions or gathering informations about a user activity or other publicly available informations. Also in this case, some commands interacts with the GraphQL LeetCode endpoint, located at `https://leetcode.com/graphql`, through HTTP POST Requests of GraphQL queries.

## 1. Login command

**Syntax:** `login`

Like the name suggests, the `login` command actually log a user into a new LeetCode session.

Once the command starts it performs two action:

1. Check if the **current session** is still active and available
2. If not, open a chromium browser directly into the login form at `https://leetcode.com/accounts/login`
3. Otherwise, fetch and prints currently logged in user details

Let's assume no session is available. The browser will open:

![Login Browser Command]({{site.baseurl}}/assets/images/login_browser_command.png){:.center}{:.resized-img}

Once there, insert *username*, *password*, complete the Cloudflare test and finally click on *Sign In*. If everything went as expected, a redirection to a custom page with a **Login Successful** title should appear. Closing the browser the application will continue fetching some details about the logged user. Eventually, the output should be:

![Login Inspect Command]({{site.baseurl}}/assets/images/login_inspect_command.png){:.center}

If the login was successful, the application does not only maintain the current username and password (in its state), but also the cookies being generated. In particular, two cookies named: `LEETCODE_SESSION` and `csrftoken`. They will be *extremely* important in order to authorize some requests to LeetCode, e.g., submission requests and so on. 

For example, regarding the `list` command, the output will contain positive status results if and only if there is a current session associated to a specific username, for which specifying if a problem has been solved or not, if its solution is visible and so on.

> This is one of the **key feature** of LeetCode Fetcher, that does not make it just a simple question downloader. However, it is important to notice that in the current version, i.e., `v0.1.1`, there's no possibility to login using third-party account.
{:.info}

> *What if I would like to login to LeetCode, but the application is running inside a container*? This is a problem, since with no X11 forwarding (or similar technologies) no browser will open. There is a solution though. You can either login using a normal browser, take the two cookies and put it into the JSON containing the saved state (take a look at [`save` command]({{site.baseurl}}/commands/state#4-save-command)), or directly use a pre-saved state JSON file and load it into the application (take a look at [`load` command]({{site.baseurl}}/commands/state#5-load-command)).
{:.info} 

> There is an actual problem with the `login` command. Although in general it works, sometimes the Cloudflare protection it's just a *pain in the a*... For some reasons, that I actually don't know, it happens that sometimes *Puppeteer* browser (changing the agent and more other adjustement) is being recognized as a bot. Not considering the fact that is the user clicking buttons and writing inputs into the textboxes. For this reason, the "Verify you are a human" box will always returns "Error". Despite this, sometimes it will successfully login, while other times a request to complete a CAPTCHA might appear. If this is your case, then try: (1) refreshing the page, (2) complete the CAPTCHA and then refresh, (3) `CTRL+C` and retry the `login` command or (4) quit the application and restart it. Eventually, you will obtain a successful login.
>
> If you whish to have a good time with LeetCode Fetcher, please **save** the state with login information and cookies. 
{:.warning}

> There is visualization problem of the timestamps for submission details in the output.
{:.bug}

The GraphQL queries used to fetch final user details are:

```graphql
#graphql
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    githubUrl
    twitterUrl
    linkedinUrl
    profile {
      ranking
      realName
      aboutMe
      websites
      reputation
      solutionCount
      solutionCountDiff
    }
    submitStats {
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
  }
}
```

Used to get general user details.

```graphql
#graphql
query languageStats($username: String!) {
  matchedUser(username: $username) {
    languageProblemCount {
      languageName
      problemsSolved
    }
  }
}
```

Used to obtain user language stats.

```graphql
#graphql
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
```

Used to obtain the list of all recents accepted submissions.

```graphql
#graphql
query recentSubmissions($username: String!, $limit: Int) {
  recentSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
```

Used to obtain the list of all recents submissions.

> For the next release, i.e., `v0.2.0`, I've planned to add a `force` optional argument to the login command, in order to force the application to starts the login action, without taking care of the validity of an already existing session. This is useful if you would like to swap user without restarting the application.
{:.info}

## 2. Inspect command

**Syntax:** `inspect [USERNAME]`

This command is used to *inspect* the profile of a given `USERNAME` or the current logged one. It uses the exactly same queries from the previous command, and shows the output in the same format. However, one thing must be said that: some informations about other users regarding submissions are available only if there is a current active session, otherwise no data will be visualized except for a lot of `undefined` values.