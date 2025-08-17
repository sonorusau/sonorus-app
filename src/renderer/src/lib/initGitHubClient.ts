import { Octokit } from "octokit";
import { getGitHubToken } from "./getGitHubToken";

export async function initGitHubClient(useEnterpriseServer: boolean): Promise<Octokit> {
  if (useEnterpriseServer) {
    return new Octokit({
      auth: await getGitHubToken(),
      baseUrl: "https://github.source.internal.cba/api/v3",
    });
  }
  return new Octokit({
    auth: await getGitHubToken(),
  });
}
