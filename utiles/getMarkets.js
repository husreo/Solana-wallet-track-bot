const {
    MARKET_STATE_LAYOUT_V3,
    MarketStateV3,
} = require('@raydium-io/raydium-sdk');
const {
    KeyedAccountInfo,
    PublicKey
} = require('@solana/web3.js') 
const { solanaConnection } = require('.');

const getMarkets = async() => {

    const openBookSubscriptionId = solanaConnection.onProgramAccountChange(
        new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"),
        "confirmed",
        async (updatedAccountInfo) => {
          const key = updatedAccountInfo.accountId.toString()
            const _ = processOpenBookMarket(updatedAccountInfo)
        },
        [
          { dataSize: MARKET_STATE_LAYOUT_V3.span },
          {
            memcmp: {
              offset: MARKET_STATE_LAYOUT_V3.offsetOf('quoteMint'),
              bytes: "So11111111111111111111111111111111111111112",
            },
          },
        ],
    )

    console.log("market IDs", openBookSubscriptionId);
    return openBookSubscriptionId;
}

  
async function processOpenBookMarket(updatedAccountInfo) {
    try {
      let accountData = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data)
      console.log("🚀 ~ processOpenBookMarket ~ accountData:", accountData)      
  
    } catch (e) {
      console.log(`Failed to process market, mint: `, accountData?.baseMint)
    }
}

module.exports = {
    getMarkets
};