<template>
    <div>
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
        <p v-if="message">{{ message }}</p>
        <div v-if="loadingLiquidations">Loading</div>
        <ul v-if="detailedTransactions.length">
            <li v-for="transaction in filteredTransactions" :key="transaction.hash" class="listItem">
                <label>Liquidation: {{ getMostValuableTokenSymbol(transaction.token_transfers) }}</label>
                <div class="date">{{ formatDate(transaction.timestamp) }}</div>
                <ul class="transactions">
                    <li>Hash: {{ transaction.hash }}</li>
                    <li>Implementation Name: {{ transaction.to.implementation_name }}</li>
                </ul>
            </li>
        </ul>
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

async function checkLiquidation() {
    if (!accountHash.value) {
        message.value = 'Please enter an account hash.';
        return;
    }

    const API_URL = 'https://explorer.mode.network/api/v2/'; // Replace with actual API URL
    const url = `${API_URL}addresses/${accountHash.value}/transactions?filter=to%20%7C%20from`;

    try {
        loadingLiquidations.value = true;
        const response = await useFetch(url);
        const data = response.data._rawValue;

        // Simple check for liquidation method (adapt based on response structure)
        const hasLiquidationTransactions = data.items.filter(
            (item) => item.method === 'safeLiquidateToTokensWithFlashLoan'
        );

        if (hasLiquidationTransactions.length) {
            message.value = '✓ Liquidation events found.';
            detailedTransactions.value = await Promise.all(
                hasLiquidationTransactions.map(async (transaction) => {
                    const transactionDetailsUrl = `${API_URL}transactions/${transaction.hash}`;
                    const detailsResponse = await useFetch(transactionDetailsUrl);
                    return detailsResponse.data._rawValue;
                })
            );
            loadingLiquidations.value = false;
        } else {
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

.transactions>li {
    margin-bottom: 3px;
}

.listItem {
    margin: 10px 0;
    padding: 10px 0;
    border-bottom: 1px solid #c4c4c4;
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
