import { HTTPRequest, HTTPResponse } from "puppeteer";

// ------------------------------------------------------------------
// -------------------------- BASE TYPES ----------------------------
// ------------------------------------------------------------------
type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

export interface QuestionTag {
  name: string;
  slug: string;
}

export interface GenericQuestionData {
  acRate             : number;
  difficulty         : Difficulty;
  questionFrontendId : number;
  paidOnly           : boolean;
  status?            : string;
  title              : string;
  titleSlug          : string;
  topicTags          : QuestionTag[];
  hasSolution        : boolean;
  hasVideoSolution   : boolean;
};

interface SimilarQuestion {
  title      : string;
  titleSlug  : string;
  difficulty : string;
};

export interface CodeSnippet {
  lang     : string;
  langSlug : string;
  code     : string;
}

interface Solution {
  id               : number;
  canSeeDetail     : boolean;
  paidOnly         : boolean;
  hasVideoSolution : boolean;
  paidOnlyVideo    : boolean;
}

export interface DetailedQuestionData extends GenericQuestionData {
  link                : string;
  questionId          : number;
  content             : string;
  similarQuestions    : SimilarQuestion[];
  exampleTestcaseList : string[];
  codeSnippets        : CodeSnippet[];
  hints               : string[];
  solution            : Solution;
};

interface SelectProblemData {
  questionId          : number;
  questionFrontendId  : number;
  title               : string;
  titleSlug           : string;
  content             : string;
  isPaidOnly          : boolean;
  difficulty          : Difficulty;
  similarQuestions    : SimilarQuestion[];
  exampleTestcaseList : string[];
  topicTags           : QuestionTag[];
  codeSnippets        : CodeSnippet[];
  hints               : string[];
  solution            : Solution;
  status              : string;
};

// ----------------------------------------------------------------------
// -------------------------- GRAPHQL OUTPUT ----------------------------
// ----------------------------------------------------------------------

export interface ProblemsetQuestionList_Output {
  problemsetQuestionList : {
    total     : number;
    questions : GenericQuestionData[];
  }
};

export interface QuestionOfToday_Output {
  activeDailyCodingChallengeQuestion: {
    date       : string;
    userStatus : string;
    link       : string;
    question   : GenericQuestionData;
  }
};

export interface SelectProblem_Output {
  question: SelectProblemData;
};

// ----------------------------------------------------------------------
// -------------------------- COMPLEX TYPES -----------------------------
// ----------------------------------------------------------------------

export interface FetchedProblems {
  count     : number;
  questions : DetailedQuestionData[];
};

interface UserProfile {
  ranking?: number,
  realName?: string,
  aboutMe?: string,
  websites: string[],
  countryName?: string,
  company?: string,
  jobTitle?: string,
  skillTags: string[],
  reputation?: number,
  solutionCount?: number
}

export interface UserSubmitStats {
  totalSubmissionNum : {difficulty: string, count: number, submissions: number}[];
  acSubmissionNum : {difficulty: string, count: number, submissions: number}[];
}

export interface MatchedUser {
  matchedUser: {
    username: string, // The user username
    githubUrl?: string, // The github URL
    twitterUrl?: string, // The twitter URL
    linkedinUrl?: string, // The linkedin URL
    profile: UserProfile, // The complete user profile
    submitStats: UserSubmitStats
  }
}

declare type LanguageProblemCount = {languageName?: string, problemsSolved?: number}[];

export interface UserLanguageStats {
  matchedUser: {
    languageProblemCount : LanguageProblemCount
  }
}

export interface ShortSubmissionDetailsData {
  runtimeDisplay?: string,
  memoryDisplay?: string,
  question?: {questionId: string},
  lang?: {name: string, verboseName: string}
}

export interface SubmissionDetailsData extends ShortSubmissionDetailsData {
  runtimePercentile?: number,
  runtimeDistribution?: string,
  memoryPercentile?: number,
  memoryDistribution?: string,
  timestamp?: number,
  code?: string,
  statusCode?: number,
  user?: {username: string}
};

export interface SubmissionDetails {
  submissionDetails?: SubmissionDetailsData;
}

export interface SubmissionData {
  id: string,
  title: string,
  titleSlug: string,
  timestamp: string,
  statusDisplay: string
}

export interface RecentSubmissionList {
  recentSubmissionList : (SubmissionData & {lang: string})[];
};

export interface RecentAcSubmissionList {
  recentAcSubmissionList : (SubmissionData & {lang: string})[];
};

export declare type ShortSubmission = SubmissionData & ShortSubmissionDetailsData;

export interface SubmissionList {
  submissionList: ShortSubmission[];
}

interface CompleteUserProfile extends UserProfile {
  username: string,
  githubUrl?: string, // The github URL
  twitterUrl?: string, // The twitter URL
  linkedinUrl?: string, // The linkedin URL
}

export interface User {
  link?: string,
  profile?: CompleteUserProfile,
  submitStats?: UserSubmitStats,
  langStats?: LanguageProblemCount,
  subList?: SubmissionList,
  acSubList?: SubmissionList
}

export interface Variable {
  name: string;
  match: string; 
  value: string | number; 
  default: string | number;
  type: string;
  desc: string,
  values: string
};

export type Variables = {
  [key: string] : Variable;
}

export interface UserLoginData {
  username?: string;
  password?: string; // This string must be hashed
  salt?: string;
};

export interface LeetcodeSessionCookies {
  csrftoken?: string;
  messages?: string;
  LEETCODE_SESSION?: string;
}

export interface ProblemsCount {
  [key: string]: number
};

export interface AppStateData {
  lastCommand?     : string;
  problemsCount?   : ProblemsCount;
  fetchedProblems? : FetchedProblems;
  dailyQuestion?   : DetailedQuestionData;
  watchQuestionId? : number;
  watchQuestion?   : DetailedQuestionData;
  selectedUser?    : string;
  userLogin?       : UserLoginData; // User login data
  cookies?         : LeetcodeSessionCookies; // Leetcode cookies from login
  profile?         : User; // The complete logged in user profile
  commands         : AppCommandData[]; // All commands
  variables        : Variables; // All the App variables
}

export type CommandCallable = (data: string[], state: AppStateData) => Promise<AppStateData>;

export interface AppCommandData {
  group?: string; // The group name of the command
  name: string; // The name of the command
  command: string; // The actual command
  syntax: RegExp; // The syntax of the command
  help: string; // The helper string
  callback: CommandCallable; // A callback function
}

export declare type HttpResponseCallBack = (r: HTTPResponse) => Promise<void>;
export declare type HttpRequestCallBack = (r: HTTPRequest) => Promise<void>;

type QVariable = string | number | undefined | string[] | Record<string,string|undefined>;
export type QueryVariables = {
  [key: string] : QVariable;
}

export interface GenericSubmitStatus {
  status_code?: number;
  pretty_lang?: string;
  run_success?: boolean;
  elapsed_time?: number;
  task_finish_time?: number;
  total_correct?: number;
  total_testcases?: number;
  status_memory?: string;
  status_runtime?: string;
  status_msg?: string;
  state: string;
  runtime_error?: string;
}

export interface TestStatus extends GenericSubmitStatus {
  code_answer?: string[];
  expected_code_answer?: string[];
  test_cases?: string[];
};

export interface SubmitStatus extends GenericSubmitStatus {
  compare_result?: string;
  last_testcase?: string;
  code_output?: string;
  expected_output?: string;
  submission_id?: string;
}

export declare type SubmissionResult = SubmitStatus & SubmissionDetails;