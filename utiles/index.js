
const axios = require('axios');
const fs = require('fs');
const { Commitment, Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getPdaMetadataKey, MARKET_STATE_LAYOUT_V3 } = require('@raydium-io/raydium-sdk');
const { getMetadataAccountDataSerializer } = require('@metaplex-foundation/mpl-token-metadata');
const { getMint, TOKEN_PROGRAM_ID, getAccount } = require('@solana/spl-token');
const { get } = require('http');
const solanaConnection = new Connection('https://aged-maximum-pallet.solana-mainnet.quiknode.pro/5d2476aba2f79657eee64c4c71173eb549693756/');

const getTokenInfo = async (tokenMint) => {
    try {
        const metadataPDA = getPdaMetadataKey(new PublicKey(tokenMint));
        const metadataAccount = await solanaConnection.getAccountInfo(metadataPDA.publicKey);
        const mintInfo = await getMint(solanaConnection, new PublicKey(tokenMint));
        
        const pairs = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
        console.log(pairs.data.pairs[0].info.socials);
        
        const pairdata = pairs.data.pairs[0];
        
        if (!metadataAccount) {
            return { ok: false, message: 'Mutable -> Failed to fetch account data' };
        }

        const serializer = getMetadataAccountDataSerializer()
        const deserialize = serializer.deserialize(metadataAccount.data);
        return  {
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
            
            // ownerInfo
        }
      
    } catch (e) {
      console.log(e);
      return null
    }
}
const ownersInfo = async (tokenMint) => {
    const filters = [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: tokenMint } }
    ];

    const holders = await solanaConnection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        encoding: "base64",
        filters
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
            const balance = amount / (10 ** mint.decimals);
            console.log(holders.length, "->", index++, '->', balance);
            if (balance) {
                owner_info.push(
                    balance
                )
            }
        }, 50 * i);
        if (i == holders.length)
            process.exit(1)
    })
    console.log('owners', owner_info);
    return owner_info.sort();
    // console.log(owner_info.length, owner_info.sort());
}

//catch bots after for liqudity pools
const getMultiplePairs = async (tokenMint) => {
    try {
        const pairs = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
        console.log(pairs.data.pairs[0].pairAddress);
        let transactionListLength = 1000
        const allTransactions = []

        let data = await solanaConnection.getSignaturesForAddress(new PublicKey(pairs.data.pairs[0].pairAddress), {
            limit: 1
        }, "confirmed");
        console.log("origin lenght ===> ", data.length);
        allTransactions.push(data);

        while (transactionListLength >= 1000) {
            const lastSignature = data[data.length - 1];
            const nextSignatures = await solanaConnection.getSignaturesForAddress(new PublicKey(pairs.data.pairs[0].pairAddress), { before: lastSignature.signature }, "confirmed");
            allTransactions.push(nextSignatures)
            data = nextSignatures
            transactionListLength = nextSignatures.length;
            console.log('current:',data.length);
            console.log('total:',allTransactions.length)
            if (allTransactions.length > 200) {
                return 'long'
            }
        }

        console.log("data ===> ", data.length);
        console.log("all lenght ===> ", allTransactions.length);

        const sniper= [];
        let isbreak = false;

        for (let index = allTransactions.length - 1; index >=0; index--) {
            for (let m = allTransactions[index].length - 1; m >=0 ; m--) {
                if (allTransactions[index][m].blockTime * 1000 > pairs.data.pairs[0].pairCreatedAt + 15000) {
                    isbreak = true;
                    break;
                }
                const history = await solanaConnection.getParsedTransaction(allTransactions[index][m].signature, {
                    maxSupportedTransactionVersion: 0,
                });
                sniper.push(history?.transaction?.message?.accountKeys?.[0]?.pubkey?.toString() ?? '');
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
            const lamports = balance/LAMPORTS_PER_SOL;
            if (Math.floor(lamports/10) > 10) {
                arr[10].push(element);
            } else {
                arr[Math.floor(lamports/10)].push(element);
            }
        }
        console.log("snipers ===> ", arr);
        return arr;
    } catch (error) {
        console.log("Dexscreener error ====>", error);
        return
    }
}

//catch bots before launch on raydium
const getMarketSniper = async (tokenMint) => {
    const accounts = await solanaConnection.getProgramAccounts(
        new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
        {
            commitment:'finalized',
            filters: [
            { dataSize: MARKET_STATE_LAYOUT_V3.span },
            {
                memcmp: {
                    offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
                    bytes: 'So11111111111111111111111111111111111111112' ,
                },
            },
            {
                memcmp: {
                    offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
                    bytes: tokenMint,
                },
            },
          ],
        }
    );
    if (accounts.length == 0)
        return null
    const market_key = await accounts.map(({ account }) => MARKET_STATE_LAYOUT_V3.decode(account.data))[0].ownAddress;
    console.log("market_key ==> ", market_key);
    let data = await solanaConnection.getSignaturesForAddress(market_key, "confirmed");
    let error_transactions = data.filter((val) => val.err !== null);
    const sniper= [];
    for (let index = 0; index < error_transactions.length; index++) {
        const tranaction = error_transactions[index];
        const history = await solanaConnection.getParsedTransaction(tranaction.signature, {
            maxSupportedTransactionVersion: 0,
        });
        sniper.push(history?.transaction?.message?.accountKeys?.[0]?.pubkey?.toString() ?? '');
    }
    
    fs.writeFile('myFile.json', JSON.stringify([...new Set(sniper)]), function (err) {
        console.log(err);
    });

    return {
        market_key,
        contract: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
        sniper: [...new Set(sniper)]
    }
}

module.exports = {getTokenInfo, getMultiplePairs, ownersInfo, getMarketSniper};