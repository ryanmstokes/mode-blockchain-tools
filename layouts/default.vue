<template>
    <v-app>
        <v-app-bar :elevation="2">
            <template v-slot:prepend>
                <v-app-bar-nav-icon></v-app-bar-nav-icon>
            </template>
            <v-app-bar-title>Chain Analytics</v-app-bar-title>
        </v-app-bar>
        <v-main>
            <v-container fluid class="fill-height">
                <v-row class="fill-height">
                    <v-col>
                        <v-card class="mx-auto" max-width="300">

                            <v-list>
                                <v-list-item v-for="item in navigationLinks.items" :key="item.title">
                                    <v-list-item-content>
                                        <NuxtLink v-if="item.type !== 'divider'" :href="item.url"> {{ item.title }}
                                        </NuxtLink>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-col>
                    <v-col sm="9">
                        <v-card class="mx-auto px-8 py-6 fill-height">
                            <slot />
                        </v-card>
                    </v-col>

                </v-row>
            </v-container>

        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
const navigationLinks = ref({
      items: [
        { type: 'subheader', title: 'Base' },
        {
          title: 'Get Wallets for Coin',
          url: '/networks/base/holders',
        },
        {
          title: 'Contract interactions',
          url: '/networks/base/contract-interactions',
        },
        { type: 'divider' },
        { type: 'subheader', title: 'Mode' },
        {
          title: 'Get Wallets for Coin',
          url: '/networks/mode/holders',
        },
        {
          title: 'Contract interactions',
          url: '/networks/mode/contract-interactions',
        },
      ],
    });
</script>