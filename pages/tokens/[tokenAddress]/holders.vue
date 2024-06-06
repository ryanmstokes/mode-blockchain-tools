<script setup>
import { useFetch } from 'nuxt/app';
import { useRoute } from 'nuxt/app';
const loading = ref(false);

const tokenHolders = ref([]);
function arrayToCSV(data) {
    // Check if data is an array
    if (!Array.isArray(data)) {
        throw new Error('Input data must be an array of objects');
    }
    const csvString = [
        [
            "Wallet",
            "Value"
        ],
        ...data.map(item => [
            item.wallet,
            item.value
        ])
    ]
        .map(e => e.join(","))
        .join("\n");
    return csvString
}
const route = useRoute();

const tokenAddress = route.params.tokenAddress; // Access tokenAddress from URL param
const index = ref(0);


async function getTokenHolders() {
    if (!tokenAddress) {
        console.error('Missing tokenAddress parameter in URL');
        return;
    }

    loading.value = true;

    const getPagedData = async (nextPage) => {


        const URL = `https://explorer.mode.network/api/v2/tokens/${tokenAddress}/holders`;
        let finalURL = '';
        if (nextPage && nextPage.value) {

            finalURL = URL + `?address_hash=${nextPage.address_hash}&value=${nextPage.value}&items_count=${nextPage.items_count}`
        } else {
            finalURL = URL;
        }
        const { data, error } = await useFetch(finalURL); // Destructure data and error


        // Assuming the API response has an "items" property within data
        await data._rawValue.items.map((item) => {
            tokenHolders.value.push({ wallet: item.address.hash, value: item.value })
        });

        if (data._rawValue.next_page_params !== null) {
            // if (data._rawValue.next_page_params.index !== 0) {
            index.value++;
            getPagedData({ address_hash: data._rawValue.next_page_params.address_hash, items_count: data._rawValue.next_page_params.items_count, value: data._rawValue.next_page_params.value.toLocaleString('fullwide', { useGrouping: false }) })
            // }
        } else {
            const CSVToString = arrayToCSV(tokenHolders.value);
            const blob = new Blob([CSVToString], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'token_holders.csv';
            link.click();

            // Revoke object URL to avoid memory leaks
            window.URL.revokeObjectURL(url);
            loading.value = false;
        }
    }
    getPagedData();
}
</script>

<template>
    <button @click="getTokenHolders">Get Token Holders</button>
    <div v-if="tokenHolders">
        <div v-if="loading" class="loading-wrap">
            <div class="loading"></div>
            <div class="title">Loading</div>
        </div>
    </div>
</template>

<style>
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
</style>
