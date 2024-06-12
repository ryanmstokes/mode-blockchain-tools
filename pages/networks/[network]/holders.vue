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

const network = route.params.network;
const index = ref(0);
const itemsCount = ref(50);
const tokenAddress = ref(''); // Access tokenAddress from URL param
const amountList = ref('');
let baseURL = '';

if (network === 'mode') {
    baseURL = 'https://explorer.mode.network'
}
if (network === 'base') {
    baseURL = 'https://base.blockscout.com'
}

async function getTokenHolders() {

    if (!tokenAddress) {
        console.error('Missing tokenAddress parameter in URL');
        return;
    }

    loading.value = true;
    const getData = async (nextPage) => {

        const URL = `${baseURL}/api/v2/tokens/${tokenAddress.value}/holders`;
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

        if (data._rawValue.next_page_params !== null && data._rawValue.next_page_params.items_count < itemsCount.value) {
            // if (data._rawValue.next_page_params.index !== 0) {
            index.value++;
            getData({ address_hash: data._rawValue.next_page_params.address_hash, items_count: data._rawValue.next_page_params.items_count, value: data._rawValue.next_page_params.value.toLocaleString('fullwide', { useGrouping: false }) })
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
    getData();

}
const allTokens = ref([]);
const getAllTokens = async () => {
    const { data, error } = await useFetch(`${baseURL}/api/v2/tokens`);
    data._rawValue.items.map((item) => {
        allTokens.value.push({
            title: item.name,
            value: item.address
        })
    })
}
getAllTokens();
</script>

<template>
    <h2 class="mb-6">Get token holders for coin</h2>

    <div v-if="tokenHolders">
        <div v-if="loading" class="loading-wrap">
            <div class="loading mt-n1"></div>
            <div class="title ">Generating CSV</div>
        </div>
    </div>
    <div v-if="!loading">
        <div class="input">
            <v-row>
                <v-select v-model="tokenAddress" v-if="allTokens" :items="allTokens" label="Select Token" />
            </v-row>

            <v-row>
                <label class="mb-2 ml-3">Amount of Wallets (*defaults to 50)</label>
            </v-row>
            <v-row>
                <v-text-field label="Enter amount (/50)" v-model="amountList"></v-text-field>
            </v-row>
        </div>

        <v-btn class="button ml-n2" @click="getTokenHolders">Get Token Holders CSV</v-btn>


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

.input,
label {
    float: left;
    clear: both;
    margin-top: 5px;
}

.button {
    float: left;
    clear: both;
    margin-top: 10px;
}
</style>
