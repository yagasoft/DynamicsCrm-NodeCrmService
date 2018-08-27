import { CrmResponse } from "../models/comm/crm-response.model";

export type httpMethod = "get" | "post" | "put" | "patch" | "delete";

export default interface ICrmService
{
	/**
	 * Initialises connection parameters and tests the connection. This should be run the first thing.
	 * @returns A promise of the current user ID.
	 * @memberof CrmService
	 */
	initialise(): Promise<string>;

	/**
	 * Sends a WhoAmI request to CRM, and returns the current user ID.
	 *
	 * @returns {Promise<string>} A promise of the current user ID.
	 * @memberof ICrmService
	 */
	testConnection(): Promise<string>;

	/**
	 * Makes a request to CRM using the given configuration parameters passed to the constructor.
	 *
	 * @param {httpMethod} method HTTP verb to use.
	 * @param {string} urlPath The remaining URL path for the request, after excluding the base URL and the URL prefix.
	 * @param {any} [data] Data object to be serialised, if the request type supports it.
	 * @param {Map<string, string>} [extraHeaders] Key-value pairs of headers to include in the request. Exclude the 'Content-Type', 'OData', and 'Accept' headers.
	 * @param {boolean} [isIgnoreSuffix] Ignores the "base URL suffix" in the configuration.
	 * @returns {Promise<CrmResponse>} A promise of CRM's response.
	 * @memberof ICrmService
	 */
	request(method: httpMethod, urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix?: boolean): Promise<CrmResponse>;

	/**
	 * Makes a GET request to CRM using the given configuration parameters passed to the constructor.
	 *
	 * @param {string} urlPath The remaining URL path for the request, after excluding the base URL and the URL prefix.
	 * @param {Map<string, string>} [extraHeaders] Key-value pairs of headers to include in the request. Exclude the 'Content-Type', 'OData', and 'Accept' headers.
	 * @param {boolean} [isIgnoreSuffix] Ignores the "base URL suffix" in the configuration.
	 * @returns {Promise<CrmResponse>} A promise of CRM's response.
	 * @memberof ICrmService
	 */
	get(urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix?: boolean): Promise<CrmResponse>;

	/**
	 * Makes a POST request to CRM using the given configuration parameters passed to the constructor.
	 *
	 * @param {string} urlPath The remaining URL path for the request, after excluding the base URL and the URL prefix.
	 * @param {any} [data] Data object to be serialised, if the request type supports it.
	 * @param {Map<string, string>} [extraHeaders] Key-value pairs of headers to include in the request. Exclude the 'Content-Type', 'OData', and 'Accept' headers.
	 * @param {boolean} [isIgnoreSuffix] Ignores the "base URL suffix" in the configuration.
	 * @returns {Promise<CrmResponse>} A promise of CRM's response.
	 * @memberof ICrmService
	 */
	post(urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix?: boolean): Promise<CrmResponse>;

	/**
	 * Makes a PUT request to CRM using the given configuration parameters passed to the constructor.
	 *
	 * @param {string} urlPath The remaining URL path for the request, after excluding the base URL and the URL prefix.
	 * @param {any} [data] Data object to be serialised, if the request type supports it.
	 * @param {Map<string, string>} [extraHeaders] Key-value pairs of headers to include in the request. Exclude the 'Content-Type', 'OData', and 'Accept' headers.
	 * @param {boolean} [isIgnoreSuffix] Ignores the "base URL suffix" in the configuration.
	 * @returns {Promise<CrmResponse>} A promise of CRM's response.
	 * @memberof ICrmService
	 */
	put(urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix?: boolean): Promise<CrmResponse>;

	/**
	 * Makes a PATCH request to CRM using the given configuration parameters passed to the constructor.
	 *
	 * @param {string} urlPath The remaining URL path for the request, after excluding the base URL and the URL prefix.
	 * @param {any} [data] Data object to be serialised, if the request type supports it.
	 * @param {Map<string, string>} [extraHeaders] Key-value pairs of headers to include in the request. Exclude the 'Content-Type', 'OData', and 'Accept' headers.
	 * @param {boolean} [isIgnoreSuffix] Ignores the "base URL suffix" in the configuration.
	 * @returns {Promise<CrmResponse>} A promise of CRM's response.
	 * @memberof ICrmService
	 */
	patch(urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix?: boolean): Promise<CrmResponse>;

	/**
	 * Makes a DELETE request to CRM using the given configuration parameters passed to the constructor.
	 *
	 * @param {string} urlPath The remaining URL path for the request, after excluding the base URL and the URL prefix.
	 * @param {Map<string, string>} [extraHeaders] Key-value pairs of headers to include in the request. Exclude the 'Content-Type', 'OData', and 'Accept' headers.
	 * @param {boolean} [isIgnoreSuffix] Ignores the "base URL suffix" in the configuration.
	 * @returns {Promise<CrmResponse>} A promise of CRM's response.
	 * @memberof ICrmService
	 */
	delete(urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix?: boolean): Promise<CrmResponse>;
}
