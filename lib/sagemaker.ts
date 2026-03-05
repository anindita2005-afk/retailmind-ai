import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";

// Initialize the SageMaker Runtime Client
// It relies on standard AWS credentials (e.g. your existing setup for Bedrock)
export const sagemakerRuntimeClient = new SageMakerRuntimeClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
});

/**
 * Invokes a deployed AWS SageMaker Endpoint
 * @param modelEndpointName The exact name of your deployed Endpoint in AWS SageMaker Console
 * @param payload Raw CSV string or JSON payload to feed the model
 * @returns Prediction Result string from the model
 */
export async function getDemandForecastPrediction(
    modelEndpointName: string,
    payload: Record<string, any>
) {
    try {
        const params = {
            EndpointName: modelEndpointName,
            ContentType: "application/json",
            Body: new TextEncoder().encode(JSON.stringify(payload)),
        };

        const command = new InvokeEndpointCommand(params);
        const response = await sagemakerRuntimeClient.send(command);

        // Decode the Uint8Array response back into a readable string/JSON
        const resultString = new TextDecoder().decode(response.Body);
        return JSON.parse(resultString);
    } catch (error) {
        console.error("SageMaker Inference Error:", error);
        throw new Error("Failed to fetch SageMaker Prediction");
    }
}
