<template>
    <div class="wrap">
        <h1>Check for Liquidation Events</h1>
        <input type="text" v-model="accountHash" placeholder="Enter Account Hash" class="input">
        <select v-model="selectedCurrency" class="select">
            <option value="all">All Coins</option>
            <option value="ezETH">ezETH</option>
            <option value="USDT">USDT</option>
            <option value="STONE">STONE</option>
            <option value="USDC">USDC</option>
            <option value="WETH">WETH</option>
        </select>
        <button @click="checkLiquidation" class="button">Check</button>
        <div class="message">
            <p v-if="message">{{ message }}</p>
        </div>
        <div v-if="loadingLiquidations">Loading</div>
        <div v-if="!loadingLiquidations && detailedTransactions.length" class=" transaction-list">
            <label class="list-title">Liquidated Transactions - <a
                    :href="`https://explorer.mode.network/address/${accountHash}`" class="wallet-button">View wallet</a>
            </label>
            <ul v-if="detailedTransactions.length" class="list">
                <li v-for="transaction in filteredTransactions" :key="transaction.hash" class="listItem">
                    <label>{{ getMostValuableTokenSymbol(transaction.token_transfers) }}</label>
                    <div class="date">{{ formatDate(transaction.timestamp) }}</div>
                    <ul class="transactions">
                        <li>Hash: {{ transaction.hash }}</li>
                        <li>Implementation Name: {{ transaction.to.implementation_name }}</li>
                        <a :href="`https://explorer.mode.network/tx/${transaction.hash}`" class="view-button">View
                            Transaction</a>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFetch } from 'nuxt/app';

const accountHash = ref('');
const message = ref('');
const detailedTransactions = ref([]);
const loadingLiquidations = ref(false);
const selectedCurrency = ref('all');
const API_URL = ref('https://explorer.mode.network/api/v2/'); // Replace with actual API URL

async function checkLiquidation() {
    if (!accountHash.value) {
        message.value = 'Please enter an account hash.';
        return;
    }

    const url = `${API_URL.value}addresses/${accountHash.value}/transactions?filter=to%20%7C%20from`;

    try {
        const response = await useFetch(url);
        const data = response.data._rawValue;

        // Simple check for liquidation method (adapt based on response structure)
        const hasLiquidationTransactions = data.items.filter(
            (item) => item.method === 'safeLiquidateToTokensWithFlashLoan'
        );

        if (hasLiquidationTransactions.length) {
            loadingLiquidations.value = true;

            message.value = '✓ Liquidation events found.';
            detailedTransactions.value = await Promise.all(
                hasLiquidationTransactions.map(async (transaction) => {
                    const transactionDetailsUrl = `${API_URL.value}transactions/${transaction.hash}`;
                    const detailsResponse = await useFetch(transactionDetailsUrl);
                    return detailsResponse.data._rawValue;
                })
            );
            loadingLiquidations.value = false;
        } else {
            loadingLiquidations.value = false;
            message.value = 'No liquidation events found.';
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

function getMostValuableTokenSymbol(tokenTransfers) {
    // You can modify this logic to prioritize based on your needs
    // Here, we assume the first token transfer is the most valuable
    return tokenTransfers?.[0]?.token?.symbol || 'N/A';
}

const filteredTransactions = computed(() => {
    if (selectedCurrency.value === 'all') {
        return detailedTransactions.value;
    } else {
        return detailedTransactions.value.filter(
            (transaction) => getMostValuableTokenSymbol(transaction.token_transfers) === selectedCurrency.value
        );
    }
});

onMounted(() => {
    // Reset message and detailed transactions on component mount
    message.value = '';
    detailedTransactions.value = [];
});


</script>


<style scoped>
/* Add any styling for the component if needed */

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
