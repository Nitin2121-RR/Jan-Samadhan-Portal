declare const _default: {
    port: number;
    nodeEnv: "development" | "production" | "test";
    databaseUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    gemini: {
        apiKey: string | undefined;
    };
    upload: {
        maxFileSize: number;
        uploadDir: string;
    };
    frontendUrl: string;
    blockchain: {
        rpcUrl: string | undefined;
        contractAddress: string | undefined;
        privateKey: string | undefined;
        etherscanApiKey: string | undefined;
    };
};
export default _default;
//# sourceMappingURL=env.d.ts.map