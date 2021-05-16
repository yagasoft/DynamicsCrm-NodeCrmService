# DynamicsCrm-NodeCrmService

(No longer maintained!)

[![Join the chat at https://gitter.im/yagasoft/DynamicsCrm-NodeCrmService](https://badges.gitter.im/yagasoft/DynamicsCrm-NodeCrmService.svg)](https://gitter.im/yagasoft/DynamicsCrm-NodeCrmService?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

### Version: 3.1.4
---

Easily authenticate with Dynamics CRM built-in services from a Node app.

## Usage

### Imports
```typescript
import { ICrmService, CrmService, CrmResponse, CrmConnectionConfig, CrmO365ConnectionConfig, CrmAdConnectionConfig } from "node-dcrm-service";
```

### Code
```typescript
const parameters =
   {
      baseUrl: "https://testorg.crm.dynamics.com",
      webApiHost: "testorg.api.crm.dynamics.com",
	  tenant: "testorg.onmicrosoft.com",
	  apiVersion: "8.2",
      username: "testuser@testorg.onmicrosoft.com",
      password: "password",
      appId: "16cd08d5-b6f1-475e-90a3-d40d83e26bbc",
      clientId: "Ao+cz9J6MNe/tyizLZR5ili3Oth/vBoZzTr5DqS6r+o="
   }
onlineConfig = new CrmO365ConnectionConfig(parameters);
onlineCrmService = new CrmService(onlineConfig);
await onlineCrmService.initialise();
const whoAmIResponse = await onlineCrmService.get("WhoAmI()");
console.log(whoAmIResponse.body.UserId)));
```

## Additional info

### Steps to getting a Client ID

[Wiki Page](https://github.com/yagasoft/DynamicsCrm-NodeCrmService/wiki/Steps-to-Getting-a-Client-ID)

### Article
The following blog post explains this library in a bit more detail: [link](http://blog.yagasoft.com/2018/09/connect-dynamics-crm-node).

## Changes

#### _v3.1.4 (2018-09-12)_
+ Added: exposed the `CrmService` interface
+ Added: append `/api/data/v8.2/` URL prefix by default
+ Added: parameterised the Web API service version
+ Improved: internally switched to `async/await` instead of explicit promises
+ Fixed: `undefined` error when request fails

#### _v2.1.3 (2018-08-27)_
+ Improved: switched to 'request' library to improve response handling
+ Improved: wrapped the response into a new class for type checking
+ Fixed: standardised response/error object

#### _v1.1.8 (2018-08-26)_
+ Added: 'data' parameter to post, put, and patch
+ Changed: exposed `CrmConnectionConfig` to be used for polymorphism

#### _v1.1.6 (2018-08-26)_
+ Added: example code
+ Added: Wiki entry for getting a Client ID
+ Removed: Node package dependency

#### _v1.1.5 (2018-08-24)_
+ Fixed: packaging issues

#### _v1.1.2 (2018-08-23)_
+ Initial release

---
**Copyright &copy; by Ahmed el-Sawalhy ([Yagasoft](http://yagasoft.com))** -- _GPL v3 Licence_
