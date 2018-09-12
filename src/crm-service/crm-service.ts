import { CrmConnectionConfig } from "./models/connection-config/abstract/crm-connection-config.model";
import { CrmO365ConnectionConfig } from "./models/connection-config/crm-o365-connection-config.model";
import { CrmAdConnectionConfig } from "./models/connection-config/crm-ad-connection-config.model";
import { CrmConnectionType } from "./models/constants/crm-connection-type.enum";
import { ICrmService, httpMethod } from "./abstract/crm-service.interface";
import * as https from 'https';
import * as req from 'request';
import * as httpntlm from 'httpntlm';
import { CrmResponse } from "./models/comm/crm-response.model";
import { StringHelpers } from "../helpers/string.helpers"

export class CrmService implements ICrmService
{
	public get cachedToken(): string
	{
		return this._cachedToken;
	}

	private onlineConfig: CrmO365ConnectionConfig;
	private adConfig: CrmAdConnectionConfig;

	private tokenEndPoint: string;
	private _cachedToken: string;

	private isInitialised: boolean = false;

	constructor(private config: CrmConnectionConfig)
	{
		switch (+config.crmConnectionType)
		{
			case CrmConnectionType.Office365:
				this.onlineConfig = <CrmO365ConnectionConfig>config;
				break;

			case CrmConnectionType.AD:
				this.adConfig = <CrmAdConnectionConfig>config;
				break;

			default:
				throw new Error(`Given CRM connection configuration '${this.config.crmConnectionType}' is of an unsupported type.`);
		}
	}

	async initialise(): Promise<string>
	{
		if (this.isInitialised)
		{
			return await this.testConnection();
		}

		switch (+this.config.crmConnectionType)
		{
			case CrmConnectionType.Office365:
				await this.authenticateWithAzureAd();
				this.isInitialised = true;
				return await this.testConnection();

			case CrmConnectionType.AD:
				this.isInitialised = true;
				return await this.testConnection();

			default:
				throw new Error(`CRM connection '${this.config.crmConnectionType}' is of an unsupported type.`);
		}
	}

	async testConnection(): Promise<string>
	{
		const response = await this.get(`/api/data/v${this.config.apiVersion || "8.2"}/WhoAmI()`, null, true);
		return response && response.body && response.body.UserId;
	}

	request = (method: httpMethod, urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse> =>
		new Promise<CrmResponse>(
			(resolve, reject) =>
			{
				if (!this.isInitialised)
				{
					reject(new Error("Must initialise service before making requests."));
					return;
				}

				const headers: any =
				{
					'OData-MaxVersion': '4.0',
					'OData-Version': '4.0',
					'Accept': 'application/json',
					'Content-Type': 'application/json; charset=utf-8'
				};

				if (extraHeaders)
				{
					extraHeaders.forEach((value, key) => headers[key] = value);
				}

				switch (+this.config.crmConnectionType)
				{
					case CrmConnectionType.Office365:
						headers.Authorization = 'Bearer ' + this.cachedToken;
						const webApiHost = StringHelpers.trimLeft(this.onlineConfig.webApiHost, ["https://"]);
						req[method](`https://` +
							`${StringHelpers.trim(webApiHost, ["/"])}` +
							`/${isIgnoreSuffix ? "" : StringHelpers.trim(this.config.urlPrefix || "", ["/"])}` +
							`/${StringHelpers.trimLeft(urlPath, ["/"])}`,
							<req.CoreOptions>
							{
								headers,
								json: data
							},
							(error, response) => this.processResponse(resolve, reject, error, response));
						break;

					case CrmConnectionType.AD:
						httpntlm[method](
							{
								url: `${StringHelpers.trimRight(this.config.baseUrl, ["/"])}` +
									`/${isIgnoreSuffix ? "" : StringHelpers.trim(this.config.urlPrefix || "", ["/"])}` +
									`/${StringHelpers.trimLeft(urlPath, ["/"])}`,
								username: this.config.username,
								password: this.config.password,
								workstation: '',
								domain: this.adConfig.domain,
								headers,
								json: data
							},
							(error, response) => this.processResponse(resolve, reject, error, response));
						break;

					default:
						throw new Error(`CRM connection '${this.config.crmConnectionType}' is of an unsupported type.`);
				}
			});

	async get(urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse>
	{
		return await this.request("get", urlPath, null, extraHeaders, isIgnoreSuffix);
	}

	async post(urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse>
	{
		return await this.request("post", urlPath, data, extraHeaders, isIgnoreSuffix);
	}

	async put(urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse>
	{
		return await this.request("put", urlPath, data, extraHeaders, isIgnoreSuffix);
	}

	async patch(urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse>
	{
		return await this.request("patch", urlPath, data, extraHeaders, isIgnoreSuffix);
	}

	async delete(urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse>
	{
		return await this.request("delete", urlPath, null, extraHeaders, isIgnoreSuffix);
	}

	private async authenticateWithAzureAd(): Promise<string>
	{
		return await this.getAzureAdTokenUrl().then(this.getO365Token);
	}

	private getAzureAdTokenUrl = (): Promise<string> =>
		new Promise<string>(
			(resolve, reject) =>
			{
				if (!this.onlineConfig)
				{
					reject(new Error("Incorrect configuration type."));
					return;
				}

				if (this.tokenEndPoint)
				{
					resolve(this.tokenEndPoint);
					return;
				}

				req.get(`https://login.windows.net/${this.onlineConfig.tenant}/.well-known/openid-configuration`,
					(error, response, body) =>
					{
						if (error)
						{
							reject(error)
							return;
						}

						try
						{
							let parsed;

							if (body)
							{
								this.tokenEndPoint = JSON.parse(body).token_endpoint;
								resolve(this.tokenEndPoint);
								return
							}

							if (parsed && parsed.error)
							{
								reject(parsed);
							}
						}
						catch (error)
						{
							reject({ headers: response.headers, statusCode: response.statusCode, statusCodeMessage: response.statusMessage, body: response.body });
						}
					});
			});

	private getO365Token = (): Promise<string> =>
		new Promise<string>(
			(resolve, reject) =>
			{
				if (!this.tokenEndPoint)
				{
					reject(new Error("Token endpoint is missing in CRM Service object."));
					return;
				}

				if (!this.onlineConfig)
				{
					reject(new Error("Incorrect configuration type."));
					return;
				}

				if (this.cachedToken)
				{
					resolve(this.cachedToken);
					return;
				}

				const tokenEndPointClean = this.tokenEndPoint.toLowerCase().replace('https://', '');
				const reqstring = `client_id=${this.onlineConfig.appId}&client_secret=${encodeURIComponent(this.onlineConfig.clientId)}&resource=${encodeURIComponent(this.config.baseUrl)}&username=${encodeURIComponent(this.config.username)}&password=${encodeURIComponent(this.config.password)}&grant_type=password`;

				req.post(`https://${tokenEndPointClean.split('/')[0]}/${tokenEndPointClean.split('/').slice(1).join('/')}`,
					<req.CoreOptions>
					{
						headers:
						{
							'Content-Type': 'application/x-www-form-urlencoded',
							'Content-Length': Buffer.byteLength(reqstring)
						},
						body: reqstring
					},
					(error, response, body) =>
					{
						if (error)
						{
							reject(error)
							return;
						}

						try
						{
							let parsed;

							if (body)
							{
								this._cachedToken = JSON.parse(body).access_token;
								resolve(this.cachedToken);
								return
							}

							if (parsed && parsed.error)
							{
								reject(parsed);
							}
						}
						catch (error)
						{
							reject({ headers: response.headers, statusCode: response.statusCode, statusCodeMessage: response.statusMessage, body: response.body });
						}
					});
			});

	private processResponse = (resolve: (value?: CrmResponse | PromiseLike<CrmResponse>) => void, reject, error, response): void =>
	{
		let parsed;

		if (error || (response && response.statusCode && typeof (response.statusCode) === "number"
			&& (response.statusCode < 200 || response.statusCode >= 300)))
		{
			try 
			{
				parsed = JSON.parse(response.body);
			}
			catch { }

			response = response || {};

			reject(
				<CrmResponse>
				{
					headers: response.headers,
					statusCode: response.statusCode, statusCodeMessage: response.statusMessage || response.statusCodeMessage,
					text: response.body, body: error || parsed
				})
			return;
		}

		try
		{
			if (response.body)
			{
				parsed = JSON.parse(response.body);
			}

			if (parsed && parsed.error)
			{
				reject(
					<CrmResponse>
					{
						headers: response.headers,
						statusCode: response.statusCode, statusCodeMessage: response.statusMessage || response.statusCodeMessage,
						text: response.body, body: parsed
					});
			}
			else
			{
				resolve(
					<CrmResponse>
					{
						headers: response.headers,
						statusCode: response.statusCode, statusCodeMessage: response.statusMessage || response.statusCodeMessage,
						text: response.body, body: parsed
					});
			}
		}
		catch (error)
		{
			reject(
				<CrmResponse>
				{
					headers: response.headers,
					statusCode: response.statusCode, statusCodeMessage: response.statusMessage || response.statusCodeMessage,
					body: response.body
				});
		}
	}
}
