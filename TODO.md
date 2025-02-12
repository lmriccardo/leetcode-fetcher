# TODO

**LEGEND**:

- [x] Completed ✅
- [ ] Not Started Yet ❌
- [?] Work in Progress 👷

### Release - v0.1.0
---

- [x] Implements the `submit` command
- [x] Move the tests to another file in the instance folder
- [x] `submit` command also updates the user details
- [x] Update the README file and all the releases
- [x] `inspect` command should always fetch user stats remotely

#### Additional

- [x] Create GitHub Pages for documenting the project

### Release - v0.2.0
---

#### Bug Fix

- [x] Remove, or find a way, to login within Docker (browser mode not possible)
- [x] Fixed a the `list` command bug when setting DIFFICULTY != from ALL
- [x] Check that when showin' the problems, it actually labels downloaded ones
- [x] Check that `fetch` command does not append already fetched problems
- [ ] When loading a state, the loaded problems are appended to the existing ones
- [ ] The daily question does not show up when looking at the state
- [x] `inspect` command output has problems with submissions timestamps
- [ ] Sometimes, when creating an instance, an error occurs releated to the README file
- [ ] When the response is taking too long to arrive, it then elapses and returns an error
- [x] Now, even if logged in it seems that it does not check solved problems
- [x] When listing problems it says that the solution is available, but it is not

#### Refactoring

- [?] Refactors the entire application state
- [?] Refactors some GraphQL query (to make them smaller than now)
- [ ] Refactors the `detail` output

#### New Features

- [ ] Implement `show` subcommands

  + With no parameter shows the state and variables (no problems)
  + `problems`: shows all the problems
  + `downloaded`: shows only downloaded problems

- [x] Add the `force` subcommand to `login`, to the force the login
- [ ] Handle Third-Party Login, e.g., Github etc ...

#### Updates

- [ ] Updates the Github pages documentation

### Release - v0.3.0
---

#### Bug Fix

#### Refactoring

- [ ] Refactors commands syntax to `<group> <command> <...args>`

#### New Features

- [ ] Better printing for commands
- [ ] Supports for other programming languages