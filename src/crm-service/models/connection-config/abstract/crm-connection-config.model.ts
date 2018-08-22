import { CrmConnectionType } from "../../constants/crm-connection-type.enum";

export default abstract class CrmConnectionConfig
{
	readonly crmConnectionType: CrmConnectionType;

	baseUrl: string;
	username: string;
	password: string;

	constructor(obj: CrmConnectionConfig)
	{
		Object.assign<CrmConnectionConfig, CrmConnectionConfig>(this, obj);
	}
}
