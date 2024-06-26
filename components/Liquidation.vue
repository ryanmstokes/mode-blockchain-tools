<template>
    <div class="wrap">
        <div class="max-w-md">
            <h2 class="mb-8 ml-n3">Contact interactions</h2>

            <v-row class="mb-3">
                <h3>Check if Wallet A</h3>
            </v-row>
            <v-row class="mb-3">
                <v-text-field type="text" v-model="accountHash" placeholder="Enter Account Address" />
            </v-row>
            <v-row class="mb-3">
                <h3>Has any transactions with the following token:</h3>
            </v-row>
            <v-row class="mb-3">
                <v-autocomplete v-model="tokenAddress" v-if="allTokens" :items="allTokens" label="Select Token" />
            </v-row>
            <v-row class="mb-3">
                <h3>With the follwiing contract:</h3>
            </v-row>
            <v-row class="mb-3">
                <v-text-field type="text" v-model="contractHash" placeholder="Enter Contract Address" />
            </v-row>
            <v-row class="mb-3">
                <v-btn @click="checkLiquidation" class="mt-6">Check</v-btn>
            </v-row>

        </div>
        <div class="message">
            <p v-if="message">{{ message }}</p>
        </div>

        <div v-if="loadingLiquidations" class="loading-wrap">
            <div class="loading"></div>
            <div class="title">Loading</div>
        </div>
        <div v-if="!loadingLiquidations && detailedTransactions.length" class=" transaction-list">
            <label class="list-title">Liquidated Transactions - <a
                    :href="`https://explorer.mode.network/address/${accountHash}`" class="wallet-button">View
                    wallet</a>
            </label>
            <ul v-if="detailedTransactions.length" class="list">
                <li v-for="transaction in filteredTransactions" :key="transaction.hash" class="listItem">
                    <label>{{ getInitiialTokenSymbolInTransfer(transaction.token_transfers) }}</label>
                    <div class="date">{{ formatDate(transaction.timestamp) }}</div>
                    <ul class="transactions">
                        <li>Transaction: {{ transaction.hash }}</li>
                        <li>Implementation Name: {{ transaction.to.implementation_name }}</li>
                        <a :href="`https://explorer.mode.network/tx/${transaction.hash}`" class="view-button">View
                            Transaction</a>
                    </ul>
                </li>
            </ul>
        </div>

        <div v-if="!loadingLiquidations && finalMatchingTokens.length" class=" transaction-list">
            <label class="list-title">Liquidated Transactions by token transfer - <a
                    :href="`https://explorer.mode.network/address/${accountHash}`" class="wallet-button">View
                    wallet</a>
            </label>
            <div v-if="finalMatchingTokens.length" class="list">
                <div v-for="transactionSet in finalMatchingTokens" class="listItem">
                    <ul>
                        <li v-for="(transaction, index) in transactionSet" :key="transaction.hash">
                            <label>{{ transaction.token.symbol }}</label>
                            <div class="date">{{ formatDate(transaction.timestamp) }}</div>
                            <ul class=" transactions">
                                <li>To: {{ transaction.to.hash }}</li>
                                <li>Transaction: {{ transaction.tx_hash }}</li>
                                <a :href="`https://explorer.mode.network/tx/${transaction.tx_hash}`"
                                    class="view-button">View
                                    token transfer Transaction</a>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFetch, useRoute } from 'nuxt/app';

const accountHash = ref('');
const message = ref('');
const detailedTransactions = ref([]);
const loadingLiquidations = ref(false);
const API_URL = ref('https://explorer.mode.network/api/v2/'); // Replace with actual API URL
let finalMatchingTokens = ref([]);
let itemsWithHash = [];
const contractHash = ref('');
const tokenAddress = ref('');
let baseURL = '';
const route = useRoute();
const network = route.params.network;

if (network === 'mode') {
    baseURL = 'https://explorer.mode.network'
}
if (network === 'base') {
    baseURL = 'https://base.blockscout.com'
}
async function findItemsWithHash(data, hashValue) {
    return new Promise(async (resolve) => {
        if (!data) {
            resolve(itemsWithHash);
            return;
        }
        //|| hashValue[1] extend for more wallets
        for (const hash of hashValue) {
            if (data.hasOwnProperty("to") && data.to.hash === hash) {
                itemsWithHash.push(data);
                break; // Exit the loop after a match is found
            }
        }

        if (Array.isArray(data.items)) {
            const promises = data.items.map(item => findItemsWithHash(item, hashValue));
            await Promise.all(promises); // Wait for all recursive calls to finish
            resolve(itemsWithHash);
        } else {
            resolve(itemsWithHash);
        }
    });
}

async function checkTokenTransfersForHash(nextPage) {

    let tokenURL = API_URL.value + `/addresses/${accountHash.value}/token-transfers`;
    if (nextPage && nextPage.index) {
        tokenURL = tokenURL + `?index=${nextPage.index}&block_number=${nextPage.block_number}`
    }
    const tokenTransfersResponse = await useFetch(tokenURL);
    const tokenTransfers = tokenTransfersResponse.data._rawValue;

    if (tokenTransfers.items && tokenTransfers.items.length > 0) {
        itemsWithHash = [];

        const matchingItems = await findItemsWithHash(tokenTransfers,
            [
                contractHash.value
            ]
        );

        if (matchingItems && matchingItems.length > 0) {
            finalMatchingTokens.value.push(matchingItems);
            if (tokenTransfers.next_page_params !== null && tokenTransfers.next_page_params.index !== 0) {
                checkTokenTransfersForHash({ index: tokenTransfers.next_page_params.index, block_number: tokenTransfers.next_page_params.block_number });
            } else {
                if (finalMatchingTokens.value && finalMatchingTokens.value.length > 0) {
                    message.value = '✓ Transactions interactins.';
                } else {
                    message.value = 'No transactions found.';
                }

                loadingLiquidations.value = false;
                return finalMatchingTokens;
            }
        } else {
            if (tokenTransfers.next_page_params !== null && tokenTransfers.next_page_params.index !== 0) {
                if (tokenTransfers.next_page_params.index !== 0) {
                    checkTokenTransfersForHash({ index: tokenTransfers.next_page_params.index, block_number: tokenTransfers.next_page_params.block_number })
                }
            } else {
                if (finalMatchingTokens.value && finalMatchingTokens.value.length > 0) {
                    message.value = '✓ Transactions found.';
                } else {
                    message.value = 'No transactions found.';
                }
                loadingLiquidations.value = false;
                return finalMatchingTokens;
            }
        }
    }
}

async function checkLiquidation(nextPageParams) {
    message.value = ''
    if (!accountHash.value) {
        message.value = 'Please enter an account hash.';
        return;
    }

    let url = `${API_URL.value}addresses/${accountHash.value}/transactions`;
    if (nextPageParams && nextPageParams.index) {
        url = url + `?index=${nextPageParams.index}&block_number=${nextPageParams.block_number}&items_count=${nextPageParams.items_count}`
    }
    try {
        loadingLiquidations.value = true;
        const response = await useFetch(url);
        const data = response.data._rawValue;

        // Simple check for liquidation method (adapt based on response structure)
        const hasLiquidationTransactions = data.items.filter(
            (item) => item.method === ('safeLiquidateToTokensWithFlashLoan')
        );

        if (hasLiquidationTransactions.length) {
            message.value = '✓ Liquidation events found.';
            detailedTransactions.value = await Promise.all(
                hasLiquidationTransactions.map(async (transaction) => {
                    const transactionDetailsUrl = `${API_URL.value}transactions/${transaction.hash}`;
                    const detailsResponse = await useFetch(transactionDetailsUrl);
                    return detailsResponse.data._rawValue;
                })
            );
            if (data.next_page_params !== null) {
                checkLiquidation(data.next_page_params);
            }
        } else {
            finalMatchingTokens.value = [];
            itemsWithHash = [];
            await checkTokenTransfersForHash();
        }

    } catch (error) {
        console.error(error);
        message.value = 'Error: Failed to check for liquidation events.';
    }

}

function formatDate(timestamp) {
    if (!timestamp) return;
    const date = new Date(timestamp); // Parse the timestamp string directly
    return date.toLocaleDateString();
}

function getInitiialTokenSymbolInTransfer(tokenTransfers) {
    return tokenTransfers?.[0]?.token?.symbol || 'N/A';
}

const filteredTransactions = computed(() => {
    if (tokenAddress.value === 'all') {
        return detailedTransactions.value;
    } else {
        return detailedTransactions.value.filter(
            (transaction) => getInitiialTokenSymbolInTransfer(transaction.token_transfers) === tokenAddress.value
        );
    }
});

onMounted(() => {
    // Reset message and detailed transactions on component mount
    message.value = '';
    detailedTransactions.value = [];
});

const allTokens = ref([]);
const getAllTokens = async (nextPageParams) => {
    let url = `${baseURL}/api/v2/tokens`;

    // "fiat_value": null,
    //     "holder_count": 6244,
    //         "is_name_null": false,
    //             "items_count": 150,
    //                 "market_cap": null,
    //                     "name": "Modeinu"
    if (nextPageParams !== (null || undefined)) {
        console.log('its not null')
        url = url + `?contract_address_hash=${nextPageParams.contract_address_hash}&items_count=${nextPageParams.items_count}&holder_count=${nextPageParams.holder_count}&name=${nextPageParams.name}&fiat_value=${nextPageParams.fiat_value}&is_name_null=${nextPageParams.is_name_null}&market_cap=${nextPageParams.market_cap}`
    }

    const { data, error } = await useFetch(url, {
        cache: true
    });
    data._rawValue.items.map((item) => {
        allTokens.value.push({
            title: item.name,
            value: item.address
        })
    })
    console.log('data._rawValue.next_page_params', data._rawValue.next_page_params)
    if (data._rawValue.next_page_params !== null) {
        getAllTokens(data._rawValue.next_page_params);
    }
}
getAllTokens();

</script>


<style scoped>
.wrap {
    padding-left: 15px;
}

.input,
.select,
.button {
    cursor: pointer
}

.select,
.button {
    height: 46px;
    margin-left: 7px;
}

.button {
    background: rgb(82, 108, 255);
    color: white;
    padding: 3px 15px;
    border-radius: 5px;
}

.loading-wrap {
    display: flex;
    align-items: center
}

.loading-wrap .title {
    margin-left: 10px;
    display: inline-block;
    opacity: 0;
    /* Initially hidden */
    animation: fadeInfadeOut infinite alternate 3s ease-in-out;
    /* Animation properties */
}

.max-w-md {
    max-width: 28rem;
    /* Adjust the value according to your needs */
}

@keyframes fadeInfadeOut {
    from {
        opacity: 0;
    }

    50% {
        opacity: 1;
    }

    /* Stays visible for half the duration */
    to {
        opacity: 0;
    }
}

.loading {
    margin-top: 10px;
    margin-right: 10px;
    width: 20px;
    height: 20px;
    border: 8px solid #f3f3f3;
    border-radius: 50%;
    border-top-color: #3498db;
    /* Color of the spinning element */
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.view-button {
    background: rgb(198, 197, 197);
    padding: 4px 8px;
    font-size: 0.8rem;
    color: rgb(52, 52, 52);
    text-decoration: none;
    border-radius: 4px;
    margin-top: 5px;
    display: inline-block;
    margin-bottom: 5px
}


.wallet-button {
    color: #313131;
}

.input {
    height: 43px;
}

.input,
.select {
    padding: 0 6px;
}

.select {
    padding-right: 5px;
}

.message {
    display: flex;
}

.message p {
    background: green;
    color: white;
    padding: 7px;
}

.transaction-list {
    margin-top: 20px;
}

.list {
    padding-left: 0;
}


.transactions {
    padding-left: 0;
}

.transactions>li {
    margin-bottom: 3px;
    list-style: none;
}

.list>li:first-child {
    border-top: 1px solid #c4c4c4;
}

.list-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 15px;
}

.listItem {
    margin: 10px 0;
    padding: 10px 0;
    border-bottom: 1px solid #c4c4c4;
    list-style: none;
}

.listItem label {
    display: inline-block;
    margin-bottom: 8px;
    font-weight: 600;
}

.loading {
    margin: 10px 0;
    font-weight: 600;
}

.date {
    margin-bottom: 5px;
}
</style>
