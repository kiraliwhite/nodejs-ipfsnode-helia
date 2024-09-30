import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";

//建立一個helia節點，此節點允許我們添加block並在以後檢索它們。
const helia = await createHelia();

//在helia節點之上建立一個檔案系統，在這裡是unixfs
const fs = unixfs(helia);

// 我們將使用這個 TextEncoder 將字串轉換為 Uint8Arrays
const encoder = new TextEncoder();
//使用encoder把字串轉成bytes，
const bytes = encoder.encode("Hello World 101");
/** Hello World 101字串的uint8array結果
 * Uint8Array(15) [
   72, 101, 108, 108, 111,
   32,  87, 111, 114, 108,
  100,  32,  49,  48,  49
]
 */

//將encode結果bytes添加到您節點之上的unixfs檔案系統，並回傳唯一內容識別符unique content identifier (CID)
const cid = await fs.addBytes(bytes);

//如果沒有toString時，的輸出是 CID(bafkreife2klsil6kaxqhvmhgldpsvk5yutzm4i5bgjoq6fydefwtihnesa)
console.log(cid.toString());

//我們傳遞給 unixfs 的bytes現在已轉換為 UnixFS DAG 並存儲在 helia 節點中。
//我們可以通過使用 cat API 並傳遞從呼叫 fs.addBytes 傳回的 CID 來存取原生字串：

//宣告一個decoder物件用於解碼bytes，宣告空字串用於存放解碼後的結果
const decoder = new TextDecoder();
let text = "";

//使用fs.cat 從 Helia 節點擷取檔案內容。
//用for of迴圈讀取fs.cat(cid) 這個陣列內的每一個元素
for await (const chunk of fs.cat(cid)) {
  //此時的chunk內容就是uint8Array，內容就是上面的uint8Array。[72,101,108,108,111,32,87,111,114,108,100,32,49,48,49]

  //在把讀取到的每一個陣列元素chunk解碼decode成為原本的字串
  text += decoder.decode(chunk, {
    stream: true,
  });
}

console.log("Added file contents:", text);
