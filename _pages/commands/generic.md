---
layout: default
title: Generic Commands
permalink: /commands/generic/
---

# Generic Commands Group ⭐

This group contains commands that can be defined *generic*, in the sense that they do no releate either to LeetCode or to the internal state of the application. All the commands of this group are: `help`, `clear` and `quit`.

## 1. Help command

**Syntax**: `help [CMD1 CMD2 ...]`

The `help` command is useful to obtain a general overview of all possible commands a user can submit to the application. As already you might know, commands are divided into groups which is also the default formatting of the command output. On the other hand, if you would like to gain more information about a specific command, or a speficic group of commands, you can pass it as arguments to the `help` command itself.

> Current implementation does not support group names as optional arguments or multiple command names. It only supports just one single parameter, that must be the name of a command. Hence, for example `help create` is valid while both `help generic` and `help create list` are not valid.
{:.bug}

Here is a fragment of the output of the `help` command.

```bash
[DD/MM/YYYY, HH:MM:SS PM/AM] >>> (Type help for commands): help
```

![Help Command Output Fragment]({{site.baseurl}}/assets/images/help_command_all.png){:.center}

> The current `help` output formatting is not the final one. Up to now it is very raw and for this reason I have planned a refactoring for version `v0.2.0` under this aspect. So, let's keep in touch.
{:.info}

## 2. Clear command

**Syntax**: `clear`

This command just clear the content of the screen.

## 3. Quit command

**Syntax**: `quit`

This command quits the application. 

> You can also use the classical `CTRL+C` combination, although it will not work as expected in certain cases. This is obviously as intended. For example, when the application requests the submission of the password, the combination will result in exiting the prompt and returning back to its normal behavior.
{:.info}