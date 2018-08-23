import { CrmService, CrmAdConnectionConfig, CrmO365ConnectionConfig } from "../dist/index";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import TestParameters from "./test-parameters";

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

		onlineConfig = new CrmO365ConnectionConfig(TestParameters.o365Params);
		onlineCrmService = new CrmService(onlineConfig);

		adConfig = new CrmAdConnectionConfig(TestParameters.adParams);
		adCrmService = new CrmService(adConfig);
	});

	describe("Basic Connectivity", function ()
	{
		this.timeout(30000);

		it("should connect", (done) =>
		{
			onlineCrmService.initialise()
				.should.eventually.equal("0FE7B290-1194-43DA-B502-7B18AC7EF15D".toLowerCase())
				.then(() => adCrmService.initialise())
				.should.eventually.equal("AB1B2223-759C-E711-80CE-00155D5F3D03".toLowerCase())
				.notify(done);
		});
	});
});
