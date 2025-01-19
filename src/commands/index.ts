import * as types from "../types"
import * as usr from './user'
import * as state from './state'
import * as prob from './problems'
import * as gen from './generic'

const commands: types.AppCommandData[] =
  [
    state.set_command  , state.show_command , state.save_command , 
    state.load_command , usr.login_command  , prob.list_command  , 
    prob.fetch_command , prob.detail_command, prob.create_command,
    gen.help_command   , gen.clear_command,   gen.quit_command,
    state.unset_command, usr.inspect_command
  ];

export default commands;