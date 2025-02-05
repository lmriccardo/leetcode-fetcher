---
layout: default
title: Application Overview
permalink: /run/
---

# Application Overview 🔎

This page contains a general overview on how the application works. The following content assumes that you have already installed the application, if not please consult the [Installation Page](./install.md). 

## 1. Running the application

Once the application is successfully installed, then run either one of the following commands:

```bash
# On Mac or Linux (global installation)
lcfetcher

# On Mac or Linux (local installation)
./node_modules/.bin/lcfetcher

# On Windows (local installation)
.\node_modules\.bin\lcfetcher.ps1 # or .cmd

# Any System (repository cloning)
npm run app
```

At first, when the application starts you should see the following content:

![Initial Application Content]({{ site.baseurl }}/assets/images/application_starts.png)

The initial content includes the current *leetcode-fetcher* **version** (e.g. `v0.1.1` in the picture), the **repository URL** and finally the **daily question**. That is, when the application starts it automatically fetches the current daily question and the total number of problems for each category and difficulty. Then it stops waiting for user inputs.

## 2. How the application works

Leetcode-Fetcher is a *command-based* application, meaning that everytime it will wait for user inputs once the previous command execution has finished. The first command is provided when first the application stops, i.e., at:

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): 
```

That is, the first command we can provide is the `help` command. It provides a general overview of all possible commands a user can input to the application, each of them with optional subcommands or arguments. You can learn more about commands in the [Command Page](./commands/index.md), so for now let's keep it simple.