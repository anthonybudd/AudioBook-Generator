<template>
    <div class="w-full pt-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div
                v-for="book in books"
                :key="book.id"
                @click="onClickLibraryBook(book)"
                class="flex flex-col items-center cursor-pointer"
            >
                <div class="w-full aspect-[1/1.6] bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 shadow-none hover:shadow-lg">
                    <img
                        :src="book.cover"
                        alt="Book Cover"
                        class="object-cover w-full h-full"
                    />
                </div>

                <h2 class="text-lg font-semibold w-full truncate mt-2">{{ book.title }}</h2>
                <div class="text-sm text-gray-500 w-full">
                    {{ book.subtitle }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['onClickLibraryBook']);

const onClickLibraryBook = (book: any) => emit('onClickLibraryBook', book);

const books = ref([{
    id: 1,
    title: 'Security Analysis',
    subtitle: 'Dodd & Graham',
    cover: '/books/security-analysis-benjamin-graham-6th-edition.png',
    file: '/books/security-analysis-benjamin-graham-6th-edition.pdf',
}, {
    id: 2,
    title: 'Faust',
    subtitle: 'Goethe',
    cover: '/books/faust.jpg',
    file: '/books/faust.pdf',
}, {
    id: 3,
    title: 'The Prince',
    subtitle: 'Machiavelli',
    cover: '/books/the-prince.jpg',
    file: '/books/the-prince.pdf',
}, {
    id: 4,
    title: 'The Art Of War',
    subtitle: 'Sun Tzu',
    cover: '/books/the-art-of-war.jpg',
    file: '/books/the-art-of-war.pdf',
}, {
    id: 5,
    title: 'Wealth of Nations',
    subtitle: 'Adam Smith',
    cover: '/books/the-wealth-of-nations.jpg',
    file: '/books/the-wealth-of-nations.pdf',
}, {
    id: 6,
    title: 'Pride And Prejudice',
    subtitle: 'Jane Austen',
    cover: '/books/pride-and-prejudice.jpg',
    file: '/books/pride-and-prejudice.pdf',
}, {
    id: 7,
    title: 'Allegory of the Cave',
    subtitle: 'Plato',
    cover: '/books/alegory-of-the-cave.jpg',
    file: '/books/alegory-of-the-cave.pdf',
}, {
    id: 8,
    title: 'Simulacra and Simulation',
    subtitle: 'Jean Baudrillard',
    cover: '/books/simulacra-and-simulation.jpg',
    file: '/books/simulacra-and-simulation.pdf',
}]);


</script>