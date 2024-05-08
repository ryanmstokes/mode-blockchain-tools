<template>
    <div>
        <h1>Check for Liquidation Events</h1>
        <input type="text" v-model="accountHash" placeholder="Enter Account Hash">
        <button @click="checkLiquidation">Check</button>
        <p v-if="message">{{ message }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFetch } from 'nuxt/app';

const accountHash = ref('');
const message = ref('');

async function checkLiquidation() {
    if (!accountHash.value) {
        message.value = 'Please enter an account hash.';
        return;
    }

    const API_URL = 'https://explorer.mode.network/api/v2/addresses/'; // Replace with actual API URL
    const url = `${API_URL}${accountHash.value}/transactions?filter=to%20%7C%20from`;

    try {
        const response = await useFetch(url);
        console.log("response", response.data._rawValue.items)
        const data = response.data._rawValue;

        // Simple check for liquidation method (adapt based on response structure)
        const hasLiquidation = data.items.some(
            (item) => item.method === 'safeLiquidateToTokensWithFlashLoan'
        );

        message.value = hasLiquidation
            ? 'Liquidation events found.'
            : 'No liquidation events found.';
    } catch (error) {
        console.error(error);
        message.value = 'Error: Failed to check for liquidation events.';
    }
}

onMounted(() => {
    // Reset message on component mount (optional)
    message.value = '';
});
</script>

<style scoped>
/* Add any styling for the component if needed */
</style>
