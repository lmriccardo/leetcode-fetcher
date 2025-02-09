const problemsetQuestionList = `#graphql
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      acRate
      difficulty
      questionFrontendId
      paidOnly: isPaidOnly
      status
      title
      titleSlug
      topicTags {
        name
        id
        slug
      }
      hasSolution
      hasVideoSolution
    }
  }
}
`

const questionOfToday = `#graphql
query questionOfToday {
  activeDailyCodingChallengeQuestion {
    date
    userStatus
    link
    question {
      acRate
      difficulty
      questionFrontendId
      paidOnly: isPaidOnly
      status
      title
      titleSlug
      topicTags {
        name
        id
        slug
      }
      hasVideoSolution
      hasSolution
    }
  }
}
`

const userSessionProgress = `#graphql
query userSessionProgress($username: String!) {
  allQuestionsCount {
    difficulty
    count
  }
  matchedUser(username: $username) {
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
  }
}
`

const selectProblem = `#graphql
query selectProblem($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    titleSlug
    content
    isPaidOnly
    difficulty
    similarQuestions
    exampleTestcaseList
    topicTags {
      name
      slug
    }
    codeSnippets {
      lang
      langSlug
      code
    }
    hints
    solution {
      id
      canSeeDetail
      paidOnly
      hasVideoSolution
      paidOnlyVideo
    }
    status
  }
}`;

const problemsetql: Record<string,string> = {
  problemsetQuestionList : problemsetQuestionList,
  questionOfToday        : questionOfToday,
  userSessionProgress    : userSessionProgress,
  selectProblem          : selectProblem
};

export default problemsetql;