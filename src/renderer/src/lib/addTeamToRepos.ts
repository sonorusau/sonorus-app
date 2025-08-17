import { Repo } from "@shared/repo/data";
import { Octokit } from "octokit";
import { getGitHubToken } from "./getGitHubToken";
import { initGitHubClient } from "./initGitHubClient";

export async function addTeamToRepos(
  org: string,
  teamSlug: string,
  permission: string,
  repos: Repo[],
): Promise<boolean> {
  console.log("Going to use: " + await getGitHubToken());
  const octo = await initGitHubClient(globalThis.useEnterpriseServer);
  console.log("Using: " + await getGitHubToken());
  for (var repo of repos) {
    const data = await octo.rest.teams.addOrUpdateRepoPermissionsInOrg({
      org: org,
      team_slug: teamSlug,
      owner: repo.owner,
      repo: repo.name,
      permission: permission
    })
  }
  return true;
}
