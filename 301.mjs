/** 需安裝模組 */
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { unixfs } from "@helia/unixfs";
import { bootstrap } from "@libp2p/bootstrap";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { MemoryBlockstore } from "blockstore-core";
import { MemoryDatastore } from "datastore-core";
import { createHelia } from "helia";
import { createLibp2p } from "libp2p";

//當呼叫此function時，會先建立一個libp2p節點，作為網路層，然後在此之上建立Helia節點
async function createNode() {
  // blockstore是我們儲存組成檔案的blocks的地方
  const blockstore = new MemoryBlockstore();

  //特定於應用程式的data存放在datastore中
  const datastore = new MemoryDatastore();

  //建立一個libp2p節點，這是一個支援Helia的網路層
  const libp2p = await createLibp2p({
    datastore,
    addresses: {
      listen: ["/ip4/127.0.0.1/tcp/0/ws"],
    },
    transports: [webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: [
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
        ],
      }),
    ],
    services: {
      //節點之間的身份驗證
      identify: identify(),
    },
  });

  /** 
   * 用於觀察peer的連線狀態
  libp2p.addEventListener("peer:discovery", (evt) => {
    console.log("Discovered %s", evt.detail.id.toString()); // Log discovered peer 紀錄發現到的peer
  });

  libp2p.addEventListener("peer:connect", (evt) => {
    console.log("Connected to %s", evt.detail.toString()); // Log connected peer 紀錄已連線的peer
  });
  */

  //在libp2p之上建立Helia節點
  return await createHelia({
    datastore,
    blockstore,
    libp2p,
  });
}

//主程式，建立兩個helia節點，底下網路層是libp2p2
const node1 = await createNode();
const node2 = await createNode();

//取得節點2的multiaddress。格式是：Multiaddr(/ip4/127.0.0.1/tcp/58795/p2p/12D3KooWBE5grKRjQtpa6RNwonnsVMMu1fYD4JrLsdoNhDbpFDvF)
const multiAddress = node2.libp2p.getMultiaddrs();
//console.log(multiAddress[0]);
//使用節點1 撥打給節點2，撥打是透過multiaddress
await node1.libp2p.dial(multiAddress[0]);

//顯示節點的peerID
console.log("Node1 Peer ID:", node1.libp2p.peerId);
console.log("Node2 Peer ID:", node2.libp2p.peerId);
//檢查自身節點的連線狀態
console.log("Node1 connections:", node1.libp2p.getConnections());
console.log("Node2 connections:", node2.libp2p.getConnections());

/** 節點1建立檔案系統，encoder物件，然後將字串encode，產生CID */
const fs = unixfs(node1);
const encoder = new TextEncoder();
const cid = await fs.addBytes(encoder.encode("Hello World 301"));
console.log("Hello World 301's CID is :", cid.toString());

/** 節點2建立檔案系統，decoder物件，然後將CID decoder，還原成字串 */
const fs2 = unixfs(node2);
const decoder = new TextDecoder();
let text = "";

//fs2.cat，就等同於ipfs cat CID，查看該CID的內容
for await (const chunk of fs2.cat(cid)) {
  text += decoder.decode(chunk, {
    stream: true,
  });
}

console.log("Fetched file contents from network:", text);
