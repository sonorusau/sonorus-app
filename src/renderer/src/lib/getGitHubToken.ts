export async function getGitHubToken(): Promise<string> {
  const { useEnterpriseServer, useConfig } = (globalThis as any);
  const { encryptStoreGetAll } = window.api;

  const githubCloudKey = "githubCloud";
  const githubEnterpriseServerKey = "githubEnterpriseServer";

  if (useConfig) {
    return encryptStoreGetAll().then(res => {
      if (useEnterpriseServer) {
        return res[githubEnterpriseServerKey];
      } else {
        return res[githubCloudKey];
      }
    });
  };

  if (useEnterpriseServer) {
    return import.meta.env.RENDERER_VITE_GITHUB_ENTERPRISE_SERVER_TOKEN;
  };

  return import.meta.env.RENDERER_VITE_GITHUB_TOKEN;
}
