import CrmConnectionConfig from "./models/connection-config/abstract/crm-connection-config.model";
import CrmO365ConnectionConfig from "./models/connection-config/crm-o365-connection-config.model";
import CrmAdConnectionConfig from "./models/connection-config/crm-ad-connection-config.model";
import { CrmConnectionType } from "./models/constants/crm-connection-type.enum";
import ICrmService, { httpMethod } from "./abstract/crm-service.interface";
import * as https from 'https';
import * as httpntlm from 'httpntlm';

export default class CrmService implements ICrmService
{
	private onlineConfig: CrmO365ConnectionConfig;
	private adConfig: CrmAdConnectionConfig;

	private tokenEndPoint: string;
	private cachedToken: string;

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
		this.get("/api/data/v8.2/WhoAmI()", null, true).then(r => r.UserId);

	request = (method: httpMethod, urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<any> =>
		new Promise<any>(
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
						https.request(
							{
								host: this.onlineConfig.webApiHost,
								path: `${isIgnoreSuffix ? "" : this.config.urlPrefix || ""}${urlPath}`,
								method,
								headers
							},
							(response) =>
							{
								const responseParts = [];
								response
									.setEncoding('utf8')
									.on('data', (chunk) => responseParts.push(chunk))
									.on('end', () =>
									{
										const response = responseParts.join('');

										try
										{
											const parsed = JSON.parse(response);
											
											if (parsed.error)
											{
												reject(parsed);
											}
											else
											{
												resolve(parsed);
											}
										}
										catch (error)
										{
											reject(response);
										}
									});
							})
							.on('error', (e) => reject(e)).end();;
						break;

					case CrmConnectionType.AD:
						httpntlm[method](
							{
								url: `${this.config.baseUrl}${isIgnoreSuffix ? "" : this.config.urlPrefix || ""}${urlPath}`,
								username: this.config.username,
								password: this.config.password,
								workstation: '',
								domain: this.adConfig.domain,
								headers
							},
							(err, res) =>
							{
								if (err)
								{
									reject(err)
									return;
								}

								const response = res.body;

								try
								{
									const parsed = JSON.parse(response);

									if (parsed.error)
									{
										reject(parsed);
									}
									else
									{
										resolve(parsed);
									}
								}
								catch (error)
								{
									reject(response);
								}
							});
						break;

					default:
						throw new Error(`CRM connection '${this.config.crmConnectionType}' is of an unsupported type.`);
				}
			});

	get = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<any> =>
		this.request("get", urlPath, extraHeaders, isIgnoreSuffix);

	post = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<any> =>
		this.request("post", urlPath, extraHeaders, isIgnoreSuffix);
	
	put = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<any> =>
		this.request("put", urlPath, extraHeaders, isIgnoreSuffix);

	patch = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<any> =>
		this.request("patch", urlPath, extraHeaders, isIgnoreSuffix);

	delete = (urlPath: string, extraHeaders?: Map<string, string>, isIgnoreSuffix: boolean = false): Promise<any> =>
		this.request("delete", urlPath, extraHeaders, isIgnoreSuffix);

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

				https.request
					({
						host: "login.windows.net",
						path: `/${this.onlineConfig.tenant}/.well-known/openid-configuration`,
						method: 'GET'
					},
					(response) =>
					{
						const responseParts = [];
						response
							.setEncoding('utf8')
							.on('data', (chunk) => responseParts.push(chunk))
							.on('end', () =>
							{
								this.tokenEndPoint = JSON.parse(responseParts.join('')).token_endpoint;
								resolve(this.tokenEndPoint);
								return;
							});
					})
					.on('error', (e) => reject(e)).end();
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
				const tokenRequest =
					https.request(
						{
							host: tokenEndPointClean.split('/')[0],
							path: `/${tokenEndPointClean.split('/').slice(1).join('/')}`,
							method: 'POST',
							headers:
							{
								'Content-Type': 'application/x-www-form-urlencoded',
								'Content-Length': Buffer.byteLength(reqstring)
							}
						}, (response) =>
						{
							const responseParts = [];
							response
								.setEncoding('utf8')
								.on('data', (chunk) => responseParts.push(chunk))
								.on('end', () =>
								{
									this.cachedToken = JSON.parse(responseParts.join('')).access_token;
									resolve(this.cachedToken);
									return;
								});
						})
						// TODO: standardise errors
						.on('error', (e) => reject(e));
				tokenRequest.write(reqstring);
				tokenRequest.end();
			});
}
