import { CrmConnectionType } from "../../constants/crm-connection-type.enum";

export abstract class CrmConnectionConfig
{
	readonly crmConnectionType?: CrmConnectionType;

	baseUrl: string;
	apiVersion?: string = "8.2";
	urlPrefix?: string = `api/data/v${this.apiVersion || "8.2"}`;
	username: string;
	password: string;

	constructor(obj: CrmConnectionConfig)
	{
		Object.assign<CrmConnectionConfig, CrmConnectionConfig>(this, obj);
	}
}
