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
  questionFrontendId: string;
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

interface Question {
  content: string;
  companyTagStats: string[];
  difficulty: Difficulty;
  exampleTestcaseList: string[];
  hints: {}[];
  isPaidOnly: boolean;
  questionId: number;
  questionFrontendId: number;
  solution: string;
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

export interface Variable {
  name: string;
  match: string; 
  value: string | number; 
  default: string | number;
  type: string;
};

export interface AppStateData {
  lastCommand?: string; // The last executed command
  lastSelectedProblems?: ProblemsData; // Last selected problems
  lastQuestion?: SingleQuestionData; // Last selected question
  selectedUser?: string; // The selected user
  commands: AppCommandData[]; // All commands
  variables: Variable[]; // All the App variables
}

export type CommandCallable = (data: string[], state: AppStateData) => Promise<AppStateData>;

export interface AppCommandData {
  name: string; // The name of the command
  command: string; // The actual command
  syntax: RegExp; // The syntax of the command
  help: string; // The helper string
  callback: CommandCallable; // A callback function
}