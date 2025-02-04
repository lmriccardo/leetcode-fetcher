---
layout: default
title: Leetcode Fetcher
---

# 1. Introduction ✨

**Leetcode Fetcher** is a *CLI* (Command-Line Interface) Application that aims to provide an easy way to *download*, *test*, *submit* 
and *solve* leetcode problems locally. All the operations are performed exploiting the underneath [GraphQL](https://graphql.org) 
and [REST](https://it.wikipedia.org/wiki/Representational_state_transfer) API of leetcode. The entire application is written in 
[TypeScript](https://www.typescriptlang.org/) and uses [NPM](https://www.npmjs.com/) as its packets manager, building and distribution tool. 

*Why Leetcode Fetcher*? It happens, very often, that when working on a solution to a leetcode problem, I would like to write and test my code locally.
It can depends on several reasons, including autocompletition, static code checking, custom tests, debugging and so on. Some of them are paid only, so
it should be reasonable to migrate the code on a local IDE or text editor. In other words, it is better to remove all the previous warnings and focus only on implementing the most-optimized solution. 

Leetcode Fetcher comes with a suite of commands able to:

- **fetch** a number, or just a single, problem/s from the problemset list of leetcode
- **create** a local instance of a selected problem, thus downloading the description, tests and the provided code snippet
- **test** a solution using custom tests, then returning back the results
- **submit** a solution to the remote API, then retuning back the results
- **inspect** a given user, or the current logged one

The last deployed version of *leetcode-fetcher* is [v0.1.1](https://github.com/lmriccardo/leetcode-fetcher/releases/tag/v0.1.1) 
available on GitHub, NPM and the Docker Hub. 

# 2. Acknowledgments 🥸

- [**LeetCode**](https://leetcode.com) for provinding this awesome platform
- [**chalk**](https://www.npmjs.com/package/chalk) for adding coloring to the application
- [**prompt**](https://www.npmjs.com/package/prompt) for the beautiful command-line prompt
- [**puppeteer**](https://www.npmjs.com/package/puppeteer) for the high-level browser control API
- [**turndown**](https://www.npmjs.com/package/turndown) for the markdown-HTML conversion tool