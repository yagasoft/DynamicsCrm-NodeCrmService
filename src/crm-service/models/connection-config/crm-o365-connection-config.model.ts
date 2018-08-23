import { CrmConnectionType } from "../constants/crm-connection-type.enum";
import CrmConnectionConfig from "./abstract/crm-connection-config.model";

export default class CrmO365ConnectionConfig extends CrmConnectionConfig
{
	readonly crmConnectionType?: CrmConnectionType = CrmConnectionType.Office365;

	webApiHost: string;
	tenant: string;

	appId: string;
	clientId: string;

	constructor(obj: CrmO365ConnectionConfig)
	{
		super(obj);
		Object.assign<CrmO365ConnectionConfig, CrmO365ConnectionConfig>(this, obj);
	}
}
