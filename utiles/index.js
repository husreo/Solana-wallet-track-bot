const axios = require("axios");
const fs = require("fs");
const {
  Commitment,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const {
  getPdaMetadataKey,
  MARKET_STATE_LAYOUT_V3,
} = require("@raydium-io/raydium-sdk");
const {
  getMetadataAccountDataSerializer,
} = require("@metaplex-foundation/mpl-token-metadata");
const { getMint, TOKEN_PROGRAM_ID, getAccount } = require("@solana/spl-token");
const { struct, u64, u8 } = require("@project-serum/borsh");
const base58 = require("bs58");
const { get } = require("http");
const dotenv = require("dotenv");

dotenv.config();

console.log("process.env.RPC_URL", process.env.RPC_URL);

const solanaConnection = new Connection(process.env.RPC_URL || "");

const getTokenInfo = async (tokenMint) => {
  try {
    const metadataPDA = getPdaMetadataKey(new PublicKey(tokenMint));
    const metadataAccount = await solanaConnection.getAccountInfo(
      metadataPDA.publicKey
    );
    const mintInfo = await getMint(solanaConnection, new PublicKey(tokenMint));

    const pairs = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`
    );
    console.log(pairs.data.pairs[0].info.socials);

    const pairdata = pairs.data.pairs[0];

    if (!metadataAccount) {
      return { ok: false, message: "Mutable -> Failed to fetch account data" };
    }

    const serializer = getMetadataAccountDataSerializer();
    const deserialize = serializer.deserialize(metadataAccount.data);
    return {
      name: deserialize[0].name,
      symbols: deserialize[0].symbol,
      supply: mintInfo.supply,
      decimal: mintInfo.decimals,
      websites: pairdata.info.websites,
      socials: pairdata.info.socials,
      exchange: pairdata.dexId,
      liquidity: pairdata.liquidity.usd,
      tokenPrice: pairdata.priceUsd,
      pooledSol: pairdata.liquidity.quote,
      marketCap: pairdata.fdv,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
};

const ownersInfo = async (tokenMint) => {
  const filters = [
    { dataSize: 165 },
    { memcmp: { offset: 0, bytes: tokenMint } },
  ];

  const holders = await solanaConnection.getProgramAccounts(TOKEN_PROGRAM_ID, {
    encoding: "base64",
    filters,
  });

  const owner_info = [];
  let index = 1;
  console.log(holders.length);
  holders.map(async (value, i) => {
    console.log(i);

    setTimeout(async () => {
      const info = await getAccount(solanaConnection, value.pubkey);
      const amount = Number(info.amount);
      const mint = await getMint(solanaConnection, info.mint);
      const balance = amount / 10 ** mint.decimals;
      console.log(holders.length, "->", index++, "->", balance);
      if (balance) {
        owner_info.push(balance);
      }
    }, 50 * i);
    if (i == holders.length) process.exit(1);
  });
  console.log("owners", owner_info);
  return owner_info.sort();
  // console.log(owner_info.length, owner_info.sort());
};

//catch bots after for liqudity pools
const getMultiplePairs = async (tokenMint) => {
  try {
    const pairs = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`
    );
    console.log(pairs.data.pairs[0].pairAddress);
    let transactionListLength = 1000;
    const allTransactions = [];

    let data = await solanaConnection.getSignaturesForAddress(
      new PublicKey(pairs.data.pairs[0].pairAddress),
      {
        limit: 1,
      },
      "confirmed"
    );
    console.log("origin lenght ===> ", data.length);
    allTransactions.push(data);

    while (transactionListLength >= 1000) {
      const lastSignature = data[data.length - 1];
      const nextSignatures = await solanaConnection.getSignaturesForAddress(
        new PublicKey(pairs.data.pairs[0].pairAddress),
        { before: lastSignature.signature },
        "confirmed"
      );
      allTransactions.push(nextSignatures);
      data = nextSignatures;
      transactionListLength = nextSignatures.length;
      console.log("current:", data.length);
      console.log("total:", allTransactions.length);
      if (allTransactions.length > 200) {
        return "long";
      }
    }

    console.log("data ===> ", data.length);
    console.log("all lenght ===> ", allTransactions.length);

    const sniper = [];
    let isbreak = false;

    for (let index = allTransactions.length - 1; index >= 0; index--) {
      for (let m = allTransactions[index].length - 1; m >= 0; m--) {
        if (
          allTransactions[index][m].blockTime * 1000 >
          pairs.data.pairs[0].pairCreatedAt + 15000
        ) {
          isbreak = true;
          break;
        }
        const history = await solanaConnection.getParsedTransaction(
          allTransactions[index][m].signature,
          {
            maxSupportedTransactionVersion: 0,
          }
        );
        sniper.push(
          history?.transaction?.message?.accountKeys?.[0]?.pubkey?.toString() ??
            ""
        );
      }
      if (isbreak) {
        break;
      }
    }
    let arr = [[], [], [], [], [], [], [], [], [], [], []];
    let uniqueArray = [...new Set(sniper)];
    for (let index = 0; index < uniqueArray.length; index++) {
      const element = uniqueArray[index];
      const balance = await solanaConnection.getBalance(new PublicKey(element));
      const lamports = balance / LAMPORTS_PER_SOL;
      if (Math.floor(lamports / 10) > 10) {
        arr[10].push(element);
      } else {
        arr[Math.floor(lamports / 10)].push(element);
      }
    }
    console.log("snipers ===> ", arr);
    return arr;
  } catch (error) {
    console.log("Dexscreener error ====>", error);
    return;
  }
};

//catch bots before launch on raydium
const getMarketSniper = async (tokenMint) => {
  const accounts = await solanaConnection.getProgramAccounts(
    new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"),
    {
      commitment: "finalized",
      filters: [
        { dataSize: MARKET_STATE_LAYOUT_V3.span },
        {
          memcmp: {
            offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
            bytes: tokenMint,
          },
        },
        {
          memcmp: {
            offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
            bytes: "So11111111111111111111111111111111111111112",
          },
        },
      ],
    }
  );

  if (accounts.length == 0) return null;
  const market_key = await accounts.map(({ account }) =>
    MARKET_STATE_LAYOUT_V3.decode(account.data)
  )[0].ownAddress;

  console.log("market_key ==> ", market_key);
  let data = await solanaConnection.getSignaturesForAddress(
    market_key,
    "confirmed"
  );
  let error_transactions = data.filter((val) => val.err !== null);
  const sniper = [];
  let counter = 0;
  for (let index = 0; index < error_transactions.length; index++) {
    console.log(error_transactions.length, "====>", counter++);
    const tranaction = error_transactions[index];
    const history = await solanaConnection.getParsedTransaction(
      tranaction.signature,
      {
        maxSupportedTransactionVersion: 0,
      }
    );
    const pubkey =
      history?.transaction?.message?.accountKeys?.[0]?.pubkey?.toString() ?? "";
    const solAmount = await getInfo(history, tranaction.signature);
    if (solAmount > 100) {
      continue;
    }
    console.log("Signature:", tranaction.signature);

    console.log("Sol amount to buy: ", solAmount);
    const sniperArr = sniper.map((snp) => snp.pubkey);
    if (sniperArr.includes(pubkey)) {
      if (solAmount>0) {
        sniperArr[sniperArr.indexOf(pubkey)].solAmount = solAmount;
      }
    } else {
      sniper.push({
        pubkey,
        solAmount: toFixed(solAmount) ,
      });
      
    }
  }
  return {
    market_key,
    contract: "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",
    sniper,
  };
};

const AccountLayout = struct([
  u8("discriminator"),
  u64("amountIn"),
  u64("minAmountOut"),
]);

const getInfo = async (history, signature) => {
  try {
    const ins = history?.meta?.innerInstructions.filter((ins) => {
      return ins?.instructions[0]?.accounts?.length == 18;
    })[0];
    const data = ins.instructions[0].data;
    const tokenData = AccountLayout.decode(Buffer.from(base58.decode(data)));
    const sol = Number(tokenData.amountIn.toString()) / 10 ** 9;
    
    return sol;
  } catch (error) {
    try {
      const ins1 = history?.transaction?.message?.instructions;
      const data1 = ins1.filter((ins) => {
        try {
          return ins.accounts.length == 18;
        } catch (error) {
          return false;0
        }
      })[0].data;
      const tokenData1 = AccountLayout.decode(
        Buffer.from(base58.decode(data1))
      );
      const sol1 = Number(tokenData1.amountIn.toString()) / 10 ** 9;
      
      return sol1;
    } catch (error) {
      return 0;
    }
  }
};

function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}
module.exports = {
  solanaConnection,
  getTokenInfo,
  getMultiplePairs,
  ownersInfo,
  getMarketSniper,
};

