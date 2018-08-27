export class CrmResponse
{
	headers: any;
	statusCode: string | number;
	statusCodeMessage: string;
	text: string;
	body: any;

	constructor(obj: CrmResponse)
	{
		Object.assign<CrmResponse, CrmResponse>(this, obj);
	}
}
