// sst.config.ts
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "retailmind-ai",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
        },
      },
    };
  },
  async run() {
    const site = new sst.aws.Nextjs("RetailMindSite", {
      path: ".",
    });

    return {
      url: site.url,
    };
  },
});