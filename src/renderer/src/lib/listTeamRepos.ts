import { Repo } from "@shared/repo/data";
import { Octokit } from "octokit";
import { getGitHubToken } from "./getGitHubToken";
import { initGitHubClient } from "./initGitHubClient";

/**
 * Fetches an array of {@link Repo} objects.
 * @param org Organization name.
 * @param team Team slug.
 * @returns
 */
export async function listTeamRepos(
  org: string,
  team: string,
): Promise<Repo[]> {
  console.log("Going to use: " + await getGitHubToken());
  const octo = await initGitHubClient(globalThis.useEnterpriseServer);
  console.log("Using: " + await getGitHubToken());
  // Fetch response data.
  const { data: reposData } = await octo.rest.teams.listReposInOrg({
    org: org,
    team_slug: team,
  });
  // Convert the response to array of repos.
  const repos: Repo[] = reposData.map((item, index: number) => {
    console.log("Parsing repo: " + index + " name: " + item.full_name);
    return {
      key: index,
      owner: item.owner.login,
      name: item.name,
      url: item.url,
    };
  });
  return repos;
}




