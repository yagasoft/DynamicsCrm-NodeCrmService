import { CrmConnectionConfig } from "./models/connection-config/abstract/crm-connection-config.model";
import { CrmO365ConnectionConfig } from "./models/connection-config/crm-o365-connection-config.model";
import { CrmAdConnectionConfig } from "./models/connection-config/crm-ad-connection-config.model";
import { CrmConnectionType } from "./models/constants/crm-connection-type.enum";
import ICrmService, { httpMethod } from "./abstract/crm-service.interface";
import * as https from 'https';
import * as req from 'request';
import * as httpntlm from 'httpntlm';
import { CrmResponse } from "./models/comm/crm-response.model";

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

	initialise(): Promise<string>
	{
		if (this.isInitialised)
		{
			return this.testConnection();
		}

		switch (+this.config.crmConnectionType)
		{
			case CrmConnectionType.Office365:
				return this.authenticateWithAzureAd().then(() => this.isInitialised = true).then(this.testConnection);

			case CrmConnectionType.AD:
				this.isInitialised = true;
				return this.testConnection();

			default:
				throw new Error(`CRM connection '${this.config.crmConnectionType}' is of an unsupported type.`);
		}
	}

	testConnection = (): Promise<string> =>
		this.get("/api/data/v8.2/WhoAmI()", null, true).then(r => r.body.UserId);

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
						req[method](`https://${this.onlineConfig.webApiHost}${isIgnoreSuffix ? "" : this.config.urlPrefix || ""}${urlPath}`,
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
								url: `${this.config.baseUrl}${isIgnoreSuffix ? "" : this.config.urlPrefix || ""}${urlPath}`,
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

	get = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse> =>
		this.request("get", urlPath, null, extraHeaders, isIgnoreSuffix);

	post = (urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse> =>
		this.request("post", urlPath, data, extraHeaders, isIgnoreSuffix);

	put = (urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse> =>
		this.request("put", urlPath, data, extraHeaders, isIgnoreSuffix);

	patch = (urlPath: string, data?: any, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse> =>
		this.request("patch", urlPath, data, extraHeaders, isIgnoreSuffix);

	delete = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<CrmResponse> =>
		this.request("delete", urlPath, null, extraHeaders, isIgnoreSuffix);

	private authenticateWithAzureAd = (): Promise<string> => this.getAzureAdTokenUrl().then(this.getO365Token);

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
		if (error)
		{
			reject(
				<CrmResponse>
				{
					headers: response.headers,
					statusCode: response.statusCode, statusCodeMessage: response.statusMessage || response.statusCodeMessage,
					text: response.body, body: error
				})
			return;
		}

		try
		{
			let parsed;

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
