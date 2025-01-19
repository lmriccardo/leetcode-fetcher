const updateSyncedCode = `#graphql
mutation updateSyncedCode($code: String!, $lang: Int!, $questionId: Int!) {
  updateSyncedCode(code: $code, lang: $lang, questionId: $questionId) {
    ok
  }
}
`

const consolePanelConfig = `#graphql
query consolePanelConfig($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    questionTitle
    enableDebugger
    enableRunCode
    enableSubmit
    enableTestMode
    exampleTestcaseList
    metaData
  }
}
`

const officialSolution = `#graphql
query officialSolution($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    solution {
      id
      title
      content
      contentTypeId
      paidOnly
      hasVideoSolution
      paidOnlyVideo
      canSeeDetail
      rating {
        count
        average
        userRating {
          score
        }
      }
      topic {
        id
        commentCount
        topLevelCommentCount
        viewCount
        subscribed
        solutionTags {
          name
          slug
        }
        post {
          id
          status
          creationDate
          author {
            username
            isActive
            profile {
              userAvatar
              reputation
            }
          }
        }
      }
    }
  }
}
`

const hasOfficialSolution = `#graphql
query hasOfficialSolution($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    solution {
      id
    }
  }
}
`

const submissionList = `#graphql
query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String!, $lang: Int, $status: Int) {
  questionSubmissionList(
    offset: $offset
    limit: $limit
    lastKey: $lastKey
    questionSlug: $questionSlug
    lang: $lang
    status: $status
  ) {
    lastKey
    hasNext
    submissions {
      id
      title
      titleSlug
      status
      statusDisplay
      lang
      langName
      runtime
      timestamp
      url
      isPending
      memory
      hasNotes
      notes
    }
  }
}
`

const submissionDetails = `#graphql
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    runtime
    runtimeDisplay
    runtimePercentile
    runtimeDistribution
    memory
    memoryDisplay
    memoryPercentile
    memoryDistribution
    code
    timestamp
    statusCode
    user {
      username
      profile {
        realName
        userAvatar
      }
    }
    lang {
      name
      verboseName
    }
    question {
      questionId
    }
    notes
    topicTags {
      tagId
      slug
      name
    }
    runtimeError
    compileError
    lastTestcase
  }
}
`

const questionEditorData = `#graphql
query questionEditorData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    codeSnippets {
      lang
      langSlug
      code
    }
    envInfo
    enableRunCode
  }
}
`

const userQuestionStatus = `#graphql
query userQuestionStatus($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    status
  }
}`

const problem_solve_ql: Record<string, string> = {
  updateSyncedCode    : updateSyncedCode,
  consolePanelConfig  : consolePanelConfig,
  officialSolution    : officialSolution,
  hasOfficialSolution : hasOfficialSolution,
  submissionList      : submissionList,
  submissionDetails   : submissionDetails,
  questionEditorData  : questionEditorData,
  userQuestionStatus  : userQuestionStatus
};

export default problem_solve_ql;