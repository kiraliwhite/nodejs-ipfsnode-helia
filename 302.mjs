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
import * as filters from "@libp2p/websockets/filters";

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
    transports: [
      webSockets({
        // connect to all sockets, even insecure ones
        filter: filters.all,
      }),
    ],
    connectionGater: {
      // 設定允許所有的地址進行連接
      denyDialMultiaddr: async () => false, // 不拒絕任何地址
      filterMultiaddrForPeer: async () => true, // 接受所有 peer 地址
    },
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: [
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
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

const [multiaddress] = node1.libp2p.getMultiaddrs(0);
console.log(multiaddress);
