const { ASSOCIATED_TOKEN_PROGRAM_ID, Liquidity, LiquidityPoolKeysV4, MARKET_STATE_LAYOUT_V3, Market, TOKEN_PROGRAM_ID } = require("@raydium-io/raydium-sdk"); 
const axios = require('axios');
const { PublicKey } = require('@solana/web3.js');

const fetchMarketId = async (connection, baseMint, quoteMint, commitment) => {
    const accounts = await connection.getProgramAccounts(
        new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
        {
            commitment,
            filters: [
                { dataSize: MARKET_STATE_LAYOUT_V3.span },
                {
                    memcmp: {
                        offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
                        bytes: baseMint.toBase58(),
                    },
                },
                {
                    memcmp: {
                        offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
                        bytes: quoteMint.toBase58(),
                    },
                },
            ],
        }
    );
    return accounts.map(({ account }) => MARKET_STATE_LAYOUT_V3.decode(account.data))[0].ownAddress
}

const generateV4PoolInfo = async (baseMint, baseDecimals, quoteMint, marketID) => {
    const poolInfo = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        baseMint: baseMint,
        quoteMint: quoteMint,
        baseDecimals: 0,
        quoteDecimals: 9,
        programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
        marketId: marketID,
        marketProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
    });

    return { poolInfo }
}

const getCreator = async (tokenMint, solanaConnection) => {
    const pairs = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    const baseMint = new PublicKey(pairs.data.pairs[0].baseToken.address);
    const quoteMint = new PublicKey(pairs.data.pairs[0].quoteToken.address);
    const marketId = await fetchMarketId(solanaConnection, baseMint, quoteMint, 'finalized')
    const baseMintInfo = await solanaConnection.getParsedAccountInfo(baseMint);
    const baseDecimals = baseMintInfo.value.data.parsed.info.decimals;

    const V4PoolInfo = await generateV4PoolInfo(baseMint, baseDecimals, quoteMint, marketId)
    // const lpMintInfo = await solanaConnection.getParsedAccountInfo(V4PoolInfo.poolInfo.lpMint);

    const filters = [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: V4PoolInfo.poolInfo.lpMint } }
    ];
    const holders = await solanaConnection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        encoding: "base64",
        filters
    });
    console.log("holder ----------------> ", holders);
}

module.exports = {getCreator}