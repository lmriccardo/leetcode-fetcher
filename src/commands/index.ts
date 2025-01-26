import * as types from "../types"
import * as usr from './user'
import * as state from './state'
import * as prob from './problems'
import * as gen from './generic'
import * as sub from './submission'

const commands: types.AppCommandData[] =
  [
    state.set_command  , state.show_command , state.save_command , 
    state.load_command , usr.login_command  , prob.list_command  , 
    prob.fetch_command , prob.detail_command, prob.create_command,
    gen.help_command   , gen.clear_command,   gen.quit_command,
    state.unset_command, usr.inspect_command, prob.daily_command,
    sub.watch_command  , sub.test_command,    sub.submit_command
  ];

export default commands;