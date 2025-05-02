import { UsernamePasswordCredential, getBearerTokenProvider } from '@azure/identity';
import { NodeOperationError, type ISupplyDataFunctions } from 'n8n-workflow';

import type { AzureOpenAIOAuth2ModelConfig } from '../types';

const AZURE_OPENAI_SCOPE = 'https://cognitiveservices.azure.com/.default';
/**
 * Creates Entra ID (OAuth2) authentication for Azure OpenAI
 */
export async function setupOAuth2AuthenticationFid(
	this: ISupplyDataFunctions,
	credentialName: string,
): Promise<AzureOpenAIOAuth2ModelConfig> {
	try {
		// Get Azure OpenAI Config (Endpoint, Version, etc.)
		const configCredentials = await this.getCredentials<{
			apiKey?: string;
			resourceName: string;
			apiVersion: string;
			endpoint?: string;
		}>(credentialName);

		const [username, password] = (configCredentials.apiKey ?? '').split('|');
		const [tenantId, clientId] = configCredentials.resourceName.split('|');

		// Set up Azure credentials
		const credential = new UsernamePasswordCredential(tenantId, clientId, username, password);
		// const credential = new EnvironmentCredential();
		// const credential = new AzureCliCredential();
		// const credential = new DefaultAzureCredential();

		// Use getBearerTokenProvider to create the function LangChain expects
		const azureADTokenProvider = getBearerTokenProvider(credential, AZURE_OPENAI_SCOPE);

		this.logger.debug('Successfully created Azure AD Token Provider.');

		return {
			azureADTokenProvider,
			azureOpenAIApiInstanceName: configCredentials.resourceName,
			azureOpenAIApiVersion: configCredentials.apiVersion,
			azureOpenAIEndpoint: configCredentials.endpoint,
		};
	} catch (error) {
		this.logger.error(`Error setting up Azure authentication: ${error.message}`, error);

		throw new NodeOperationError(
			this.getNode(),
			`Error setting up Azure authentication: ${error.message}`,
			error,
		);
	}
}
