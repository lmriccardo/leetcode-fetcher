---
layout: default
title: Commands
permalink: /commands/
---

# Leetcode-Fetcher Commands ⌨️

This documentation page aims to illustrate each command group and, for each of them, what's is about.

## 1. Command groups

As already being said, running the `help` shows all possible commands (with optional or required parameters) that can be submitted to the application. As you might notice, each batch of commands is separated by a title. This string represents the name of the **group** to which then entire batch belongs to. That is, commands are divided into groups: *Generic*, *Problems*, *User*, *Submissions* and *State*. 

The following table shows all possible commands for each existing group.

{% include table.html %}

## 2. Groups Specification

### Generic Commands Group

This first group, called **Generic**, contains a number of commands that are "generic", meaning they do not releate either to LeetCode or to the current state of the application. Commands like `help`, `clear` or `quit` belongs to this group. Their name are already quite esplicative, however you could find more in the specific page, [here]({{site.baseurl}}/commands/generic/).

### Problems Commands Group

This group, called **Problems**, contains commands releated to LeetCode problems. In particular, they aim to interact with a specific LeetCode endpoint to extract problems information and fetch problems locally. However, they do not releate to LeetCode users or submission informations (these are left to others command groups). Commands like `list`, `fetch`, `detail`, `create` and `daily` belongs to this group. You can find more about *Problems* commands [here]({{site.baseurl}}/commands/problems/).

### User Commands Group

This group, called **User**, contains commands releated to LeetCode Users. Through commands in this group, a user can login into LeetCode and create a new session or, inspects other users statistics like: total number of submissions per difficulty, last accepted submissions, github profile, linkedin profile, public personal informations and so on. Commands like `login` and `inspect` belongs to this group. You can find more [here]({{site.baseurl}}/commands/user/).

### Submission Commands Group

This group, called **Submission**, contains commands releated to LeetCode Submissions. Using this commands, you can test your current local solution remotely (through the LeetCode backend), provides new tests and submit a final solution that can be either accepted or not. In all cases, results are returned back to the user. Commands like `watch`, `test` and `submit` belongs to this group. You can find more [here]({{site.baseurl}}/commands/submissions/).

### State Commands Group

The final group is called **State** since all of its commands interact with the state of the application. You can find more [here]({{site.baseurl}}/commands/state/).