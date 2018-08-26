# DynamicsCrm-NodeCrmService

[![Join the chat at https://gitter.im/yagasoft/DynamicsCrm-NodeCrmService](https://badges.gitter.im/yagasoft/DynamicsCrm-NodeCrmService.svg)](https://gitter.im/yagasoft/DynamicsCrm-NodeCrmService?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

### Version: 1.1.7
---

Easily authenticate with Dynamics CRM built-in services from a Node app.

## Usage

### Imports
```typescript
import { CrmService, CrmO365ConnectionConfig, CrmAdConnectionConfig } from "node-dcrm-service";
```

### Code
```typescript
const parameters =
   {
      baseUrl: "https://testorg.crm.dynamics.com",
      webApiHost: 'testorg.api.crm.dynamics.com',
      tenant: 'testorg.onmicrosoft.com',
      username: "testuser@testorg.onmicrosoft.com",
      password: "password",
      appId: "16cd08d5-b6f1-475e-90a3-d40d83e26bbc",
      clientId: "Ao+cz9J6MNe/tyizLZR5ili3Oth/vBoZzTr5DqS6r+o="
   }
onlineConfig = new CrmO365ConnectionConfig(parameters);
onlineCrmService = new CrmService(onlineConfig);
onlineCrmService.initialise()
   .then(v => onlineCrmService.get("/api/data/v8.2/WhoAmI()")
      .then(r => console.log(r.UserId)));
```

## Steps to getting a Client ID

[Wiki Page](https://github.com/yagasoft/DynamicsCrm-NodeCrmService/wiki/Steps-to-Getting-a-Client-ID)

## Changes

#### _v1.1.7 (2018-08-26)_
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
