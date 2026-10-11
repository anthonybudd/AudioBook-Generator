<template>
    <div class="fixed top-0 left-0 right-0 z-50 bg-secondary dark:bg-black">
        <nav class="border-b">

            <div class="relative">
                <div class="flex items-center py-3 mx-auto">
                    <router-link
                        class="flex-shrink-0 px-6 cursor-pointer"
                        to="/"
                    >
                        Anthony Budd
                    </router-link>
                    <!-- <div class="flex-1 flex items-center ml-8">
                        <div class="flex items-center space-x-4 lg:space-x-6">
                            <router-link
                                v-for="item in menuItems"
                                :key="item.to"
                                :to="item.to"
                                class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                <span class="inline-flex items-center gap-1">
                                    <component
                                        :is="item.icon"
                                        class="w-4 h-4 inline-block"
                                    />
                                    {{ item.label }}
                                </span>
                            </router-link>
                        </div>
                    </div> -->
                    <div
                        class="text-sm text-muted-foreground hover:text-primary cursor-pointer text-center"
                        @click="theme = theme === 'light' ? 'dark' : 'light'"
                    >
                        <Moon
                            v-if="theme === 'light'"
                            class="w-4 h-4 mx-auto"
                        />
                        <Sun
                            v-else
                            class="w-4 h-4 mx-auto"
                        />

                    </div>
                </div>
            </div>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { LayoutGrid, ReceiptText, User, Menu } from 'lucide-vue-next';
// import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";




import { Sun, Moon } from 'lucide-vue-next';
import { useColorMode } from '@vueuse/core';
const theme = useColorMode();



import { computed } from 'vue';


const menuItems = [
    {
        label: 'Dashboard',
        icon: LayoutGrid,
        to: '/',
    },
    {
        label: 'Index',
        icon: ReceiptText,
        to: '/index',
    },
    {
        label: 'Account',
        icon: User,
        to: '/account',
    },
];
</script>
