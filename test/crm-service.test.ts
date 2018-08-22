import CrmService from "../src/crm-service/crm-service";
import CrmO365ConnectionConfig from "../src/crm-service/models/connection-config/crm-o365-connection-config.model";
import CrmAdConnectionConfig from "../src/crm-service/models/connection-config/crm-ad-connection-config.model";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";

describe("CRM Service", () =>
{
	let onlineCrmService: CrmService;
	let adCrmService: CrmService;
	let onlineConfig: CrmO365ConnectionConfig;
	let adConfig: CrmAdConnectionConfig;

	before(() =>
	{
		chai.use(chaiAsPromised);
		chai.should();

		onlineConfig = new CrmO365ConnectionConfig(
			<CrmO365ConnectionConfig>
			{
				baseUrl: "https://linkdevtest013.crm4.dynamics.com",
				webApiHost: 'linkdevtest013.api.crm4.dynamics.com',
				tenant: 'linkdevtest013.onmicrosoft.com',
				username: "admin@linkdevtest013.onmicrosoft.com",
				password: "linkP@ss",
				appId: "90f183b7-0ece-48e9-a9c2-cf494b1e06aa",
				clientId: "Sn+cz7J6NNe/ampkLZR5fgi3Oth/vBoZzTr5DxS2r+o="
			});

		adConfig = new CrmAdConnectionConfig(
			<CrmAdConnectionConfig>
			{
				baseUrl: "http://192.168.137.229/GenericSolution",
				username: "administrator",
				password: "a",
				domain: "YAGASOFT1"
			});

		onlineCrmService = new CrmService(onlineConfig);
		adCrmService = new CrmService(adConfig);
	});

	describe("Model", function ()
	{
		this.timeout(30000);

		it("should connect", function (done)
		{
			onlineCrmService.initialise()
				.should.eventually.equal("0FE7B290-1194-43DA-B502-7B18AC7EF15D".toLowerCase())
				.then(() => adCrmService.initialise())
				.should.eventually.equal("AB1B2223-759C-E711-80CE-00155D5F3D03".toLowerCase())
				.notify(done);
		});
	});
});
