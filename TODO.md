# TODO

### Release - v0.1.0
---

- [x] Implements the `submit` command
- [x] Move the tests to another file in the instance folder
- [x] `submit` command also updates the user details
- [ ] Update the README file and all the releases
- [x] `inspect` command should always fetch user stats remotely

#### Additional

- [ ] Create GitHub Pages for documenting the project

### Release - v0.2.0
---

- [ ] Implement `show` subcommands

  + With no parameter shows the state and variables (no problems)
  + `problems`: shows all the problems
  + `downloaded`: shows only downloaded problems
  + `user`: shows current user statistics

- [ ] Check that `fetch` command does not append already fetched problems
- [ ] Check that when showin' the problems, it actually labels downloaded ones
- [ ] Better printing for commands
- [ ] When loading a state, the loaded problems are appended to the existing ones
- [ ] Add the `force` subcommand to `login`, to the force the login
- [ ] Remove, or find a way, to login within Docker (browser mode not possible)