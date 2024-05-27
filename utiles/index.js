
const axios = require('axios');
const fs = require('fs');
const { Commitment, Connection, PublicKey } = require('@solana/web3.js');
const { getPdaMetadataKey } = require('@raydium-io/raydium-sdk');
const { getMetadataAccountDataSerializer } = require('@metaplex-foundation/mpl-token-metadata');
const { getMint, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { get } = require('http');
const {getCreator} = require("./getCreator");

// const tokenMint = "7y1TrdzE1cEeCgBvgdNB9DViMYdQ7UU2FKhnPDLYa7ae"
const solanaConnection = new Connection('https://aged-maximum-pallet.solana-mainnet.quiknode.pro/5d2476aba2f79657eee64c4c71173eb549693756/');

const getTokenInfo = async (tokenMint) => {
    try {
        const metadataPDA = getPdaMetadataKey(new PublicKey(tokenMint));
        const metadataAccount = await solanaConnection.getAccountInfo(metadataPDA.publicKey);
        const mintInfo = await getMint(solanaConnection, new PublicKey(tokenMint));
        // await getCreator(tokenMint, solanaConnection);
        // const ownerInfo = await ownersInfo(tokenMint);
        // const allAccounts = await findHolders();
        // console.log("all Owners ==>> ", allAccounts);
        
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
    // console.log(holders.length);

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
            console.log(index++, '->', balance);
            if (balance) {
                owner_info.push(
                    balance
                )
            }
        }, 10 * i);
        if (i == holders.length)
            process.exit(1)
    })
    return owner_info.sort();
    // console.log(owner_info.length, owner_info.sort());
}
const getMultiplePairs = async (tokenMint) => {
    return (async () => {
        try {
            const pairs = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);

            const data = await solanaConnection.getSignaturesForAddress(new PublicKey(pairs.data.pairs[0].pairAddress));
            // const data = await solanaConnection.getSignaturesForAddress(new PublicKey(tokenMint));
            const filter_by_time = data.filter((elem) => elem.blockTime < pairs.data.pairs[0].pairCreatedAt + 15000);

            const sniper= [];
            console.log("Searching bots......");
            let index = 0;
            for (const iterator of filter_by_time) {
                console.log(filter_by_time.length + '=>', index++);
                const history = await solanaConnection.getParsedTransaction(iterator.signature, {
                    maxSupportedTransactionVersion: 0,
                });
    
                sniper.push(history?.transaction?.message?.accountKeys?.[0]?.pubkey?.toString() ?? '');
            }

            let uniqueArray = [...new Set(sniper)];
            return uniqueArray;
        } catch (error) {
            console.log("Dexscreener error ====>", error);
            return
        }
    }
    )();
}

module.exports = {getTokenInfo, getMultiplePairs, ownersInfo};