import * as types from '../types';
import * as utils from '../utils';

export const app_variables : types.Variable[] = 
  [
    { name: 'CATEGORY',   match: 'CATEGORY\\s(\\w+)',      value: "algorithms", default: "algorithms", type: "s"},
    { name: 'LIMIT',      match: 'LIMIT\\s(\\d+)',         value: 20          , default: 20          , type: "n"},
    { name: 'SKIP',       match: 'SKIP\\s(\\d+)',          value: 0           , default: 0           , type: "n"},
    { name: 'DIFFICULTY', match: 'DIFFICULTY\\s(\\w+)',    value: "EASY"      , default: "ALL"       , type: "s"},
    { name: 'FOLDER'    , match: 'FOLDER\\s([\\w\\./-]+)', value: './problems', default: "./problems", type: "s"},
  ];

export const working_values: string[] = 
  [
    "(Possible values: algorithms)",
    "(Possible values: 1...Inf)",
    "(Possible values: 1...Inf)",
    "(Possible values: Easy, Medium, Hard, All)",
    "(Possible values: any folder name)"
  ];

export const ConstructRegex = (name: string, vars: types.Variable[], unset?: boolean) : RegExp => {
  const prefix = utils.FormatString("^{0}", name);

  const regex_str = vars.map((value: types.Variable) : string => {
    const name_val = "(" + value.name + ")";
    return utils.FormatString("(?:\\s+{0})?", (unset || false) ? name_val : value.match);
  }).reduce((prev: string, curr: string) => (prev + curr));

  return new RegExp(prefix + regex_str);
}