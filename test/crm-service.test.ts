import { ICrmService, CrmService, CrmAdConnectionConfig, CrmO365ConnectionConfig } from "../dist/index";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import TestParameters from "./test-parameters";
import { expect } from "chai";

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

		it("should connect Online", async () =>
		{
			expect(await onlineCrmService.initialise())
				.equal("0FE7B290-1194-43DA-B502-7B18AC7EF15D".toLowerCase())
		});

		it("should connect AD", async () =>
		{
			expect(await adCrmService.initialise())
				.equal("b7d1585d-fdb0-e811-8102-00155d5f3d03".toLowerCase())
		});
	});

	describe("Basic Request", function ()
	{
		this.timeout(30000);

		it("should WhoAmI Online", async () =>
		{
			await onlineCrmService.initialise();
			expect((await onlineCrmService.get("WhoAmI()")).body.UserId)
				.equal("0FE7B290-1194-43DA-B502-7B18AC7EF15D".toLowerCase())
		});

		it("should WhoAmI AD", async () =>
		{
			await adCrmService.initialise();
			expect((await adCrmService.get("WhoAmI()")).body.UserId)
				.equal("b7d1585d-fdb0-e811-8102-00155d5f3d03".toLowerCase())
		});
	});
});
