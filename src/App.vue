<template>
    <div class="container max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">

        <div class="flex flex-col items-center justify-center pt-10 gap-2">
            <h1 class="text-4xl font-bold text-center">Audiobook Generator</h1>
            <p class="text-lg text-gray-600 text-center max-w-xl mb-6">
                This app uses Kokoro.js to generate speech client-side in the browser.
                <br />
                Upload a PDF or try one of the books in the library.
                <br />
                Built by <a
                    href="https://anthonybudd.io"
                    target="_blank"
                    class="text-blue-600 hover:text-blue-700"
                >Anthony Budd</a>
            </p>

            <input
                ref="fileInput"
                type="file"
                accept="application/pdf,.pdf"
                class="sr-only"
                @change="onFileSelected"
            />
            <Button
                type="button"
                :disabled="isLoading"
                size="lg"
                @click="openFilePicker"
            >
                <FileUp class="size-5" />
                {{ fileName ? 'Choose another PDF' : 'Select PDF' }}
            </Button>
            <p
                v-if="errorMessage"
                class="text-sm text-destructive"
                role="alert"
            >
                {{ errorMessage }}
            </p>
        </div>

        <Library
            v-if="!file"
            @onClickLibraryBook="onClickLibraryBook"
        />

        <div
            v-if="pageCount"
            ref="pagesRoot"
            class="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-8"
        >
            <figure
                v-for="page in pageCount"
                :key="`${documentId}-${page}`"
                class="overflow-hidden rounded-lg border bg-white shadow-sm"
            >
                <canvas
                    :ref="(element) => setPageCanvas(element, page - 1)"
                    class="block h-auto w-full bg-white"
                    :aria-label="`Page ${page}`"
                />
            </figure>
        </div>

        <footer
            v-if="pageCount"
            class="fixed bottom-0 left-0 right-0 w-full bg-white border-t px-6 py-3 z-50 flex items-center gap-4"
        >
            <button
                @click="onClickPlayPause"
                class="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                aria-label="Play/Pause"
            >
                <span v-if="!isPlaying">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <polygon
                            points="6,4 20,12 6,20"
                            fill="currentColor"
                        />
                    </svg>
                </span>
                <!-- <span v-else-if="isGeneratingAudio">
                  <Loader2 class="w-6 h-6 animate-spin" />
              </span> -->
                <span v-else>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <rect
                            x="6"
                            y="4"
                            width="4"
                            height="16"
                            rx="1"
                            fill="currentColor"
                        />
                        <rect
                            x="14"
                            y="4"
                            width="4"
                            height="16"
                            rx="1"
                            fill="currentColor"
                        />
                    </svg>
                </span>
            </button>
            <div class="flex-1 flex items-center gap-3">
                <input
                    type="range"
                    min="1"
                    :max="pageCount"
                    step="1"
                    :value="currentPage"
                    :style="{ '--page-progress': pageProgress }"
                    class="page-progress w-full cursor-pointer"
                    aria-label="Progress through PDF pages"
                    :aria-valuetext="`Page ${currentPage} of ${pageCount}`"
                    @input="seekToPage"
                />
            </div>
            <span
                v-if="pageCount"
                class="text-sm text-gray-600 tabular-nums select-none whitespace-nowrap shrink-0"
            >
                Page {{ currentPage }} of {{ pageCount }}
            </span>
            <!-- <span class="text-sm text-gray-600 tabular-nums select-none whitespace-nowrap shrink-0">
                <Settings class="w-4 h-4 cursor-pointer" />
            </span>
            <span class="text-sm text-gray-600 tabular-nums select-none whitespace-nowrap shrink-0">
                <Download class="w-4 h-4 cursor-pointer" />
            </span> -->
        </footer>
    </div>
    <Toaster />
</template>

<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { Toaster } from 'vue-sonner';
import { FileUp } from 'lucide-vue-next';
// import { FileUp, Loader2, Settings, Download } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref, nextTick, watch, type ComponentPublicInstance } from 'vue';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button } from '@/components/ui/button';
import Library from '@/components/Library.vue';
import AudioPlayer from '@/AudioPlayer';


const theme = useColorMode();
watch(theme, (newVal: any) => localStorage.setItem('theme', newVal));
onMounted(() => theme.value = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const worker = new Worker(new URL('worker.js', import.meta.url), {
    type: 'module',
});

const onErrorReceived = (e: ErrorEvent) => {
    console.error("Worker error:", e);
    errorMessage.value = e.message;
};

worker.addEventListener("error", onErrorReceived);

const audioPlayer = new AudioPlayer(worker, {
    // isGeneratingAudio: (generating: boolean) => {
    //     isGeneratingAudio.value = generating;
    // },
    isPlaying: (playing: boolean) => {
        isPlaying.value = playing;
    },
    onPlayNextPage: (page: number) => {
        nextTick(() => {
            if (pagesRoot.value) {
                const figures = pagesRoot.value.querySelectorAll('figure');
                const figure = figures[page - 1];
                if (figure) {
                    const rect = figure.getBoundingClientRect();
                    const scrollTop = window.scrollY + rect.top - 40;
                    window.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                    currentPage.value = page;
                }
            }
        });
    },
});

const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(null);
const pagesRoot = ref<HTMLElement | null>(null);
const pageCanvases: HTMLCanvasElement[] = [];

const fileName = ref('');
const pageCount = ref(0);
const currentPage = ref(1);
const documentId = ref(0);
const isLoading = ref(false);
// const isGeneratingAudio = ref(false);
const isPlaying = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');

const pageProgress = computed(() => {
    if (pageCount.value <= 1) return '100%';
    const ratio = (currentPage.value - 1) / (pageCount.value - 1);
    return `${Math.min(100, Math.max(0, ratio * 100))}%`;
});

let requestSerial = 0;
let scrollFrame = 0;
let seekLock = 0;
let pdfDocument: PDFDocumentProxy | null = null;

onMounted(() => {
    window.addEventListener('scroll', scheduleCurrentPageUpdate, { passive: true });
    window.addEventListener('resize', scheduleCurrentPageUpdate, { passive: true });
});

onBeforeUnmount(async () => {
    requestSerial += 1;
    window.removeEventListener('scroll', scheduleCurrentPageUpdate);
    window.removeEventListener('resize', scheduleCurrentPageUpdate);
    worker.removeEventListener("error", onErrorReceived);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
});

const updateCurrentPage = () => {
    if (seekLock) return;

    const figures = pagesRoot.value?.querySelectorAll('figure');
    if (!figures?.length) return;

    const footerTop = document.querySelector('footer')?.getBoundingClientRect().top ?? window.innerHeight;
    let bestPage = 1;
    let bestOverlap = Number.NEGATIVE_INFINITY;

    figures.forEach((figure, index) => {
        const rect = figure.getBoundingClientRect();
        const overlap = Math.min(rect.bottom, footerTop) - Math.max(rect.top, 0);
        if (overlap > bestOverlap) {
            bestOverlap = overlap;
            bestPage = index + 1;
        }
    });

    currentPage.value = bestPage;
};

const scheduleCurrentPageUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        updateCurrentPage();
    });
};

const openFilePicker = () => fileInput.value?.click();

const setPageCanvas = (element: Element | ComponentPublicInstance | null, index: number) => {
    if (element instanceof HTMLCanvasElement) {
        pageCanvases[index] = element;
    }
};

const onClickLibraryBook = async (book: any) => {
    const bookBlob = await fetch(book.file);
    const pdfFile = new File([await bookBlob.blob()], book.title + ".pdf", { type: "application/pdf" });
    file.value = pdfFile;
    fileName.value = book.title;
    renderPdf();
};

const onFileSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    file.value = input.files?.[0] as File | null;
    input.value = '';
    if (!file.value) return;
    const isPdfFile = (file: File) => {
        const type = file.type.toLowerCase();
        return type === '' || type === 'application/pdf' || type === 'application/x-pdf' || file.name.toLowerCase().endsWith('.pdf');
    };
    if (!isPdfFile(file.value)) return errorMessage.value = 'Choose a PDF file.';

    await renderPdf();
};

const renderPdf = async () => {
    if (!file.value) return;
    const serial = ++requestSerial;
    isLoading.value = true;
    errorMessage.value = '';
    statusMessage.value = 'Opening PDF…';
    fileName.value = file.value.name;
    pageCount.value = 0;
    currentPage.value = 1;
    pageCanvases.length = 0;

    try {
        // await pdfDocument?.destroy().catch(() => undefined);
        pdfDocument = null;

        const data = new Uint8Array(await file.value.arrayBuffer());
        if (serial !== requestSerial) return;

        const pdf = await getDocument({ data }).promise;
        if (serial !== requestSerial) {
            return;
        }

        pdfDocument = pdf;
        audioPlayer.setPdfDocument(pdfDocument);
        documentId.value += 1;
        pageCount.value = pdf.numPages;
        await nextTick();
        if (serial !== requestSerial) return;
        updateCurrentPage();

        const availableWidth = pagesRoot.value?.clientWidth || 768;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            if (serial !== requestSerial) return;
            statusMessage.value = `Loading page ${pageNumber} of ${pdf.numPages}…`;
            const page = await pdf.getPage(pageNumber);
            const canvas = pageCanvases[pageNumber - 1];
            if (!canvas) continue;

            const unscaled = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: availableWidth / unscaled.width });
            canvas.width = Math.floor(viewport.width * pixelRatio);
            canvas.height = Math.floor(viewport.height * pixelRatio);

            await page.render({
                canvas,
                viewport,
                transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
            }).promise;
        }

        if (serial !== requestSerial) return;
        statusMessage.value = '';
        updateCurrentPage();
    } catch (error) {
        console.error(error);
        if (serial !== requestSerial) return;
        pageCount.value = 0;
        statusMessage.value = '';
        errorMessage.value = 'That file could not be opened as a PDF.';
    } finally {
        if (serial === requestSerial) isLoading.value = false;
    }
};

const seekToPage = (event: Event) => {
    const page = Number((event.target as HTMLInputElement).value);
    if (!Number.isInteger(page) || page < 1 || page > pageCount.value) return;

    currentPage.value = page;
    const figure = pagesRoot.value?.querySelectorAll('figure')[page - 1];
    if (!(figure instanceof HTMLElement)) return;

    const lock = ++seekLock;
    const top = figure.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    window.setTimeout(() => {
        if (seekLock === lock) {
            seekLock = 0;
        }
    }, 80);
};

const onClickPlayPause = async () => {
    if (audioPlayer.isPlaying) {
        audioPlayer.pause();
    } else {
        await audioPlayer.play(currentPage.value);
    }
};
</script>

<style scoped>
.page-progress {
    appearance: none;
    height: 0.5rem;
    border-radius: 9999px;
    background: linear-gradient(to right, #2563eb var(--page-progress), #e5e7eb var(--page-progress));
    outline: none;
}

.page-progress::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 9999px;
    background: #2563eb;
    cursor: pointer;
}

.page-progress::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border: none;
    border-radius: 9999px;
    background: #2563eb;
    cursor: pointer;
}

.page-progress::-moz-range-track {
    height: 0.5rem;
    border: none;
    border-radius: 9999px;
    background: #e5e7eb;
}

.page-progress::-moz-range-progress {
    height: 0.5rem;
    border-radius: 9999px;
    background: #2563eb;
}
</style>
