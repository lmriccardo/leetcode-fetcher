import { HTTPRequest, HTTPResponse } from "puppeteer";

// Questions Data
type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

export interface QuestionTag {
  name: string;
  slug: string;
  translatedName?: string;
}

export interface QuestionGenericData {
  acRate: number;
  difficulty: Difficulty;
  freqBar?: string;
  questionFrontendId: number;
  isFavor: boolean;
  isPaidOnly: boolean;
  status?: string
  title: string;
  titleSlug: string;
  topicTags: QuestionTag[];
  hasSolution: boolean;
  hasVideoSolution: boolean;
}

export interface ProblemsetQuestionListData {
  problemsetQuestionList: {
    total: number;
    questions: QuestionGenericData[];
  };
}

export interface DailyQuestionData {
  date: string,
  userStatus: string,
  link: string,
  question: QuestionGenericData;
}

export interface DailyQuestion {
  activeDailyCodingChallengeQuestion: DailyQuestionData;
}

export interface ProblemsData {
  totalQuestions: number;
  count: number;
  problemsetQuestionList: QuestionGenericData[];
}

export interface CodeSnippetData {
  lang: string;
  langSlug: string;
  code: string;
}

interface Solution {
  id: string,
  canSeeDetails: boolean,
  hasVideoSolution: boolean,
  paidOnlyVideo: boolean
}

interface Question {
  content: string;
  companyTagStats: string[];
  difficulty: Difficulty;
  exampleTestcaseList: string[];
  hints: {}[];
  isPaidOnly: boolean;
  questionId: number;
  questionFrontendId: number;
  solution: Solution;
  status: string|null,
  title: string;
  titleSlug: string;
  topicTags: QuestionTag[];
  codeSnippets: CodeSnippetData[];
}

export interface SelectProblemData {
  question: Question;
}

export interface SingleQuestionData extends SelectProblemData {
  link: string;
}

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
  lastCommand?: string; // The last executed command
  problemsCount?: ProblemsCount, // The total number of problems for each difficulty
  lastSelectedProblems?: ProblemsData; // Last selected problems
  lastQuestion?: SingleQuestionData; // Last selected question
  dailyQuestion?: SingleQuestionData; // The daily question
  watchQuestionId?: number, // The cached problem Id
  watchQuestion?: SingleQuestionData, // The cached problem details
  selectedUser?: string; // The selected user
  userLogin?: UserLoginData; // User login data
  cookies?: LeetcodeSessionCookies; // Leetcode cookies from login
  profile?: User; // The complete logged in user profile
  commands: AppCommandData[]; // All commands
  variables: Variables; // All the App variables
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