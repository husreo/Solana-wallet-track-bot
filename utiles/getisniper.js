const {
    LIQUIDITY_STATE_LAYOUT_V4,
    MAINNET_PROGRAM_ID,
    LiquidityStateV4,
    Liquidity,
    TokenAccount,
    SPL_ACCOUNT_LAYOUT,
    MARKET_STATE_LAYOUT_V3,
    getPdaMetadataKey
} = require('@raydium-io/raydium-sdk')

const {
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token')

const {
    Connection,
    PublicKey,
    Commitment,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js')

const fs = require('fs')
const bs58 = require('bs58')
const { EmbedBuilder } = require('discord.js');
const { getInfo } = require('./index');
const axios = require("axios");
const {
    getMetadataAccountDataSerializer,
} = require("@metaplex-foundation/mpl-token-metadata");
// const { struct, u64, u8 } = require("@project-serum/borsh");
// const base58 = require("bs58");

const pools = []
// const connection = new Connection(
//     "https://mainnet.helius-rpc.com/?api-key=39d83ffa-585c-4f90-8636-2f6795db4cb3", {
//     wsEndpoint: "wss://mainnet.helius-rpc.com/?api-key=39d83ffa-585c-4f90-8636-2f6795db4cb3"
// })
const connection = new Connection(process.env.RPC_URL || "")
const channels = [
    "1248701289357901905",
    "1248701312250675230",
    "1248701356370563072",
    "1248701377853788230",
    "1248701398032580609",
    "1248701431461187615",
    "1248701457520132177",
    "1248701481100509194",
    "1248701511182192681",
    "1248701544908722226",
    "1245149719643291769",
];
const snipingLimitTime = 10000
// let buyers = []
const snipers = []
const existingOpenBookMarkets = []
let account_id = -1;
let flag = true;
const runListener = async (interaction) => {
    const runTimestamp = Math.floor(new Date().getTime() / 1000)
    let accountData = undefined;
    // console.log("open book ===>>>", MAINNET_PROGRAM_ID.OPENBOOK_MARKET);
    account_id = connection.onProgramAccountChange(
        MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
        async (updatedAccountInfo) => {
            // const info = await connection.getAccountInfo(updatedAccountInfo.accountId);
            // const serializedInfo = MARKET_STATE_LAYOUT_V3.decode(info.data);
            // console.log("account info ===>>", serializedInfo);
            if (flag) {
                const key = updatedAccountInfo.accountId.toString();
                if (!existingOpenBookMarkets.includes(key)) {
                    accountData = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data)
                    existingOpenBookMarkets.push(key)
                    
                    // const poolInfo = Liquidity.getAssociatedPoolKeys({
                    //     version: 4,
                    //     marketVersion: 3,
                    //     marketId: updatedAccountInfo.accountId,
                    //     baseMint: accountData.baseMint,
                    //     quoteMint: accountData.quoteMint,
                    //     baseDecimals: baseMintInfo.decimals,
                    //     quoteDecimals: quoteMintInfo.decimals,
                    //     programId: this.ammProgramId,
                    //     marketProgramId: marketInfo.programId,
                    //   })
                    const pairs = await axios.get(
                        `https://api.dexscreener.com/latest/dex/tokens/${accountData.baseMint.toBase58()}`
                    );
                    if (pairs.data.pairs) {
                        console.log("exist");
                    } else {
                        console.log("token ====>>>", accountData.baseMint.toBase58());
                        const _ = processOpenBookMarket(accountData, interaction)
                    }
                }
                flag = false;
                setTimeout(async () => {
                    flag = true;
                }, 1000);
            }
        },
        "confirmed",
        [
            { dataSize: MARKET_STATE_LAYOUT_V3.span },
            {
                memcmp: {
                    offset: MARKET_STATE_LAYOUT_V3.offsetOf('quoteMint'),
                    bytes: NATIVE_MINT.toBase58(),
                },
            },
        ],
    )
    console.log(`Listening for new pools`)
}

async function trackWallets(quoteVault, token, interaction) {
    console.log("token ===>>>", quoteVault);
    const buyers = []
    try {

        const onLogId = connection.onLogs(
            quoteVault,
            async ({ logs, err, signature }) => {
                if (err) {
                    const parsedData = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: "confirmed" })
                    const signer = parsedData?.transaction.message.accountKeys.filter((elem) => {
                        return elem.signer == true
                    })[0].pubkey
                    if (signer) {
                        const balance = await getInfo(parsedData);
                        if (balance != 'err' && balance < 1000) {
                            const fee = parsedData?.meta.fee;
                            const one = {
                                address: signer.toBase58(),
                                balance,
                                fee: fee / LAMPORTS_PER_SOL,
                                sig: signature
                            }
                            if (!buyers.map(({ address }) => address).includes(signer.toBase58())) {
                                console.log("buyer ====>", one);
                                buyers.push(one)
                            }
                        }
                    }
                }
            },
            "confirmed"
        );
        setTimeout(async () => {
            const pairs = await axios.get(
                `https://api.dexscreener.com/latest/dex/tokens/${token}`
            );

            console.log("//////////// It is sniping.///////////////");
            console.log("//////////// buyers lenght", buyers.length);
            // const market_key = await getmarketKey(token);
            if (buyers.length != 0 && !pairs.data.pairs) {
                let moonEmbed1 = new EmbedBuilder()
                    .setColor(0x6058f3)
                    .setTitle("Spy snipers")
                    .addFields({ name: `Contract`, value: `\`${token}\`` })
                    // .addFields({
                    //     name: `Market ID`,
                    //     value: `\`${market_key.toBase58()}\``,
                    // })
                    .addFields({ name: `:orange_circle: = Runing ${buyers.length}`, value: `:warning:    Wallet | Buy Amount | Fee` })
    
                let sniperList = "";
                let fieldCount = 0;
                let embedCount = 0;
    
                for (let index = 0; index < buyers.length; index++) {
                    
                    const sniper = `:orange_circle: [${buyers[index].address.slice(0, 5)}...${buyers[index].address.slice(buyers[index].address.length - 5, buyers[index].address.length - 1)}](https://solscan.io/token/${buyers[index].address}) | \`${buyers[index].balance}\` | \`${buyers[index].fee}\` | [${buyers[index].sig.slice(0, 5)}...${buyers[index].sig.slice(buyers[index].sig.length - 5, buyers[index].sig.length - 1)}](https://solscan.io/token/${buyers[index].sig}) \n`;
    
                    if (sniperList.length + sniper.length > 1024) {
                        moonEmbed1.addFields({
                            name: `Snipers ${fieldCount + 1}`,
                            value: sniperList,
                        });
                        sniperList = "";
                        fieldCount++;
                        if (fieldCount * 1024 > 6000) {
                            const i = Math.floor(buyers.length / 10) >= 9 ? 9 : Math.floor(buyers.length / 10)
                            const channel = await interaction.client.channels.fetch(channels[i]);
                            await channel.send({ embeds: [moonEmbed1] });
                            moonEmbed1 = new EmbedBuilder()
                                .setColor(0x6058f3)
                                .setTitle(`Spy snipers (Embed ${embedCount})`);
                            embedCount++;
                            fieldCount = 0;
                        }
                    }
                    sniperList += sniper;
                }
    
                if (sniperList.length > 0) {
                    moonEmbed1.addFields({
                        name: `Snipers ${fieldCount + 1}`,
                        value: sniperList,
                    });
                }
                const i = Math.floor(buyers.length / 10) >= 9 ? 9 : Math.floor(buyers.length / 10)
                const channel = await interaction.client.channels.fetch(channels[i]);
                // const channel = await interaction.client.channels.fetch(channels[0]);
                await channel.send({ embeds: [moonEmbed1] });
            }

            // buyers = [];
            connection.removeOnLogsListener(onLogId)
        }, snipingLimitTime);
    } catch (error) {
        console.log("🚀 ~ trackWallets ~ error:", error)
    }
}

async function getmarketKey(tokenMint) {
    const accounts = await connection.getProgramAccounts(
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
    const market_info = await accounts.map(({ account }) =>
        MARKET_STATE_LAYOUT_V3.decode(account.data)
    );
    // console.log("market info ===>>>", market_info);
    const market_key = market_info[0].ownAddress;
    // console.log("market_key ==> ", market_key);
    return market_key;
}

async function getTokenAccounts(
    connection,
    owner,
    commitment,
) {
    const tokenResp = await connection.getTokenAccountsByOwner(
        owner,
        {
            programId: TOKEN_PROGRAM_ID,
        },
        commitment,
    );

    const accounts = [];
    for (const { pubkey, account } of tokenResp.value) {
        accounts.push({
            pubkey,
            programId: account.owner,
            accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
        });
    }

    return accounts;
}

async function processOpenBookMarket(accountData, interaction) {
    try { 
        console.log("New market Created.")
        
        trackWallets(accountData.quoteVault, accountData.baseMint.toBase58(), interaction)
    } catch (e) {
        console.log(`Failed to process market, mint: `, accountData?.baseMint)
    }
}
async function processRaydiumPool(id, poolState, interaction) {
    try {
        trackWallets(poolState.quoteVault, poolState.baseMint.toBase58(), interaction)
    } catch (error) { }
}

async function removeisniper(interaction) {
    try {
        const alertEmbed = new EmbedBuilder()
            .setColor(0x6058f3)
            .setTitle("closed")
        await connection.removeProgramAccountChangeListener(account_id);
        await interaction.editReply({ embeds: [alertEmbed] });
    } catch (error) {
        const errorAlert = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Something went wrong")
        await interaction.editReply({ embeds: [errorAlert] });
    }
}
const checkMutable = async (baseMint) => {
    try {
        const metadataPDA = getPdaMetadataKey(new PublicKey(baseMint));
        const metadataAccount = await connection.getAccountInfo(metadataPDA.publicKey);
        if (!metadataAccount?.data) {
            return { ok: false, message: 'Mutable -> Failed to fetch account data' };
        }
        const serializer = getMetadataAccountDataSerializer()
        const deserialize = serializer.deserialize(metadataAccount.data);
        console.log("deserialize ===>>>", deserialize);
        const mutable = deserialize[0].isMutable;

        return !mutable
    } catch (e) {
        return false
    }
}
// runListener().catch(e => console.log("Error running sniper tracker"))
module.exports = { runListener, removeisniper }