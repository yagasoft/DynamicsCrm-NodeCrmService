import { CrmConnectionType } from "../../constants/crm-connection-type.enum";

export abstract class CrmConnectionConfig
{
	readonly crmConnectionType?: CrmConnectionType;

	baseUrl: string;
	urlPrefix?: string;
	username: string;
	password: string;

	constructor(obj: CrmConnectionConfig)
	{
		Object.assign<CrmConnectionConfig, CrmConnectionConfig>(this, obj);
	}
}
