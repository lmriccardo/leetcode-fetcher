import * as types from '../types'

export const FormatUserData = (user: types.MatchedUser, lstats: types.UserLanguageStats,
  subList: types.SubmissionList, acSubList: types.SubmissionList) : types.User => (
  {
    link: `https://leetcode.com/u/${user!.matchedUser.username}`,
    profile: {
      username: user!.matchedUser.username,
      realName: user!.matchedUser.profile.realName,
      aboutMe: user!.matchedUser.profile.aboutMe,
      reputation: user!.matchedUser.profile.reputation,
      ranking: user!.matchedUser.profile.ranking,
      githubUrl: user!.matchedUser.githubUrl,
      twitterUrl: user!.matchedUser.twitterUrl,
      linkedinUrl: user!.matchedUser.linkedinUrl,
      websites: user!.matchedUser.profile.websites,
      skillTags: user!.matchedUser.profile.skillTags
    },
    submitStats: user!.matchedUser.submitStats,
    langStats: lstats!.matchedUser.languageProblemCount,
    subList: subList,
    acSubList: acSubList
  }
)

export const FormatShortSubmissionDetails = (details: types.SubmissionDetails)
  : types.ShortSubmissionDetailsData =>
(
  {
    runtimeDisplay: details.submissionDetails?.runtimeDisplay,
    memoryDisplay: details.submissionDetails?.memoryDisplay,
    question: details.submissionDetails?.question,
    lang: details.submissionDetails?.lang
  }
);

export const FormatCookies = (cookies?: types.LeetcodeSessionCookies) : {Cookie: string} | undefined => {
  if (!cookies) return undefined;

  const cookie_s = `LEETCODE_SESSION=${cookies.LEETCODE_SESSION!}; ` +
      `csrftoken=${cookies.csrftoken!};`;

  return {"Cookie": cookie_s};
}

export const FormatString = (template: string, ...args: any[]): string => {
  return template.replace(/{(\d+)}/g, (_, index) => args[index] || "");
}

const CenterString = (str: string, width: number): string =>
{
  // Calculate the total padding required
  const padding = width - str.length;

  // If the string is already wider than the desired width, return the original string
  if (padding <= 0) {
      return str;
  }

  // Calculate left and right padding
  const leftPadding = Math.floor(padding / 2);
  const rightPadding = Math.ceil(padding / 2);

  // Return the centered string
  return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
}

export const JustifyString = (str: string, width: number, dir: number): string =>
{
  if (dir == 0) return CenterString(str, width); // Center the string

  const remaining_size = (width - str.length) > 0;
  if (dir == -1) return str + ((remaining_size) ? ' '.repeat(width - str.length) : '');
  if (dir == 1) return ((remaining_size) ? ' '.repeat(width - str.length) : '') + str;
  return str;
}