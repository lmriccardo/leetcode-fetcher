import * as types from './types'

export const FetchProblems = async (
  options: {category?: string; limit?: number; skip?: number; tags?: string; difficulty?: string;},
  formatData: (data: types.ProblemsetQuestionListData) => types.ProblemsData,
  query: string
) : Promise<types.ProblemsData | null> => {
  try {
    // Adjust the query variables to correct values
    const category = options.category === undefined ? '' : options.category;
    const tags = options.tags ? options.tags.split(' ') : [];
    const skip = options.skip || 0;
    const difficulty = options.difficulty || undefined;
    const limit = options.limit || 20;

    // Sends a post requests to the graphql endpoint of leetcode
    const response = await fetch('https://leetcode.com/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://leetcode.com',
        },
        body: JSON.stringify({
          query: query,
          variables: {
            categorySlug: category,
            skip: skip,
            limit: limit,
            filters: {tags, difficulty},
          }
        }),
      }
    );

    // Obtain the json response representation
    const result = await response.json() as { data: types.ProblemsetQuestionListData };
    return formatData(result.data);

  } catch (error) {
    console.error("Error when fetching problems: ", error);
    return null;
  }
}

export const FetchQuestion = async (
  titleSlug: string,
  formatData: (data: types.SelectProblemData) => types.SingleQuestionData,
  query: string
) : Promise<types.SingleQuestionData | null> => {
  try {
    // Sends a post requests to the graphql endpoint of leetcode
    const response = await fetch('https://leetcode.com/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://leetcode.com',
        },
        body: JSON.stringify({
          query: query,
          variables: {
            titleSlug: titleSlug,
          }
        }),
      }
    );

    // Obtain the json response representation
    const result = await response.json() as { data: types.SelectProblemData };
    return formatData(result.data);

  } catch (error) {
    console.error("Error when fetching question: ", error);
    return null;
  }
}