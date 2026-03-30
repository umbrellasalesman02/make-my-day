export type DeployInput = {
  slug: string;
  path: string;
  content: string;
};

export type DeployResult = {
  slug: string;
  previewUrl: string;
  localPath: string;
};

export interface Deployer {
  deploy(input: DeployInput): Promise<DeployResult>;
}
