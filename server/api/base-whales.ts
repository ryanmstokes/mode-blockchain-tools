

import { CovalentClient } from "@covalenthq/client-sdk";

export default defineEventHandler(async (event) => {

    const client = new CovalentClient("cqt_rQDhpdTPxM7tQqXQRtQRGQjHmBDf");
    const tokenAddress = '0x940181a94a35a4569e4529a3cdfb74e38fd98631';
    try {
            const resp = await client.BaseService.getAllChains();
            return resp;
    } catch (error) {
        return error.message
        return error
    }

})
