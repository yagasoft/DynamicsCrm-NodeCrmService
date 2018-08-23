import { CrmConnectionType } from "../constants/crm-connection-type.enum";
import CrmConnectionConfig from "./abstract/crm-connection-config.model";

export class CrmAdConnectionConfig extends CrmConnectionConfig
{
	readonly crmConnectionType?: CrmConnectionType = CrmConnectionType.AD;
	domain: string;

	constructor(obj: CrmAdConnectionConfig)
	{
		super(obj);
		Object.assign<CrmAdConnectionConfig, CrmAdConnectionConfig>(this, obj);
	}
}
