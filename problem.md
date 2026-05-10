root@C202605041845697:~# cd phantom-mock
root@C202605041845697:~/phantom-mock# dir
ACTIONS_GUIDE.md            README.md
ADMIN_SETUP.md              scripts
data                        src
dist                        start.sh
docker-compose.yml          static
Dockerfile                  temp-import
EPAY_MODULE_SUMMARY.md      temp-uploads
eslint.config.js            tsconfig.backend.json
index.html                  tsconfig.backend.tsbuildinfo
MIGRATION.md                tsconfig.frontend.json
node_modules                tsconfig.frontend.tsbuildinfo
NODE_WS_GUIDE.md            tsconfig.json
package.json                vite.config.ts
PAYMENT_INTEGRATION.md      vite-ssr.config.server.ts
PAYMENT_QUICK_REFERENCE.md  vite-ssr.config.ts
pnpm-lock.yaml              vite-ssr.config.ts.bak
public
root@C202605041845697:~/phantom-mock# node -e '
> const { MongoClient } = require("mongodb");
> const url = "mongodb://localhost:27017";
> const client = new MongoClient(url);
>
> async function run() {
>   try {
>     await client.connect();
>     const db = client.db("phantom-mock");
>     const collections = await db.listCollections().toArray();
>
>     if (collections.length === 0) {
>       console.log("数据库 phantom-mock 是空的或不存在。");
>       return;
>     }
>
>     for (let colInfo of collections) {
>       const colName = colInfo.name;
>       const data = await db.collection(colName).findOne();
>       console.log(`\n📦 集合 [${colName}] 预览:`);
>       console.log(data ? JSON.stringify(data, null, 2) : "(空集 合)");
>     }
>   } catch (err) {
>     console.error("连接失败:", err.message);
>   } finally {
>     await client.close();
>   }
> }
> run();
> '
数据库 phantom-mock 是空的或不存在。
root@C202605041845697:~/phantom-mock#