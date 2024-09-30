// 將資料寫入本地blockstore的記憶體上，再由本地的其他節點讀取

import { unixfs } from "@helia/unixfs";
import { MemoryBlockstore } from "blockstore-core";
import { createHelia } from "helia";

// 其他可用的blockstore
//   - https://www.npmjs.com/package/blockstore-fs - a filesystem blockstore (for use in node)
//   - https://www.npmjs.com/package/blockstore-idb - an IndexDB blockstore (for use in browsers)
//   - https://www.npmjs.com/package/blockstore-level - a LevelDB blockstore (for node or browsers,
//                                                      儘管將檔案儲存在資料庫中很少是個好主意

//將block儲存在記憶體
const blockstore = new MemoryBlockstore();

//建立helia節點
const helia = await createHelia({
  blockstore,
});

//建立一個在helia節點上的檔案系統，這裡是unixfs
const fs = unixfs(helia);

//encoder物件，將字串轉為uint8Array
const encoder = new TextEncoder();

const cid = await fs.addBytes(encoder.encode("Hello World 201"));

console.log(cid.toString());

// 以下是在額外建立第二個helia節點，然後透過CID去讀取從第一個節點加進去的字串

const helia2 = await createHelia({
  blockstore,
});

const fs2 = unixfs(helia2);

const decoder = new TextDecoder();
let text = "";

//使用第二個helia節點，讀取第一個節點寫入資料時回傳的CID
for await (const chunk of fs2.cat(cid)) {
  text += decoder.decode(chunk, {
    stream: true,
  });
}

console.log(text);
