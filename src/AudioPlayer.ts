import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

interface AudioPlayerOptions {
    isGeneratingAudio: (generating: boolean) => void;
    isPlaying: (isPlaying: boolean) => void;
    onPlayNextPage: (page: number) => void;
}

interface PageAudio {
    audio: any;
    element: HTMLAudioElement;
}

export default class AudioPlayer {
    private worker: Worker;
    private pdfDocument: PDFDocumentProxy | null = null;
    private pageAudio: { [page: number]: { [chunk: number]: PageAudio; }; } = {};
    options: AudioPlayerOptions;
    isPlaying: boolean = false;

    constructor(worker: Worker, options: AudioPlayerOptions) {
        this.worker = worker;
        this.options = options;
    }

    setPdfDocument(pdfDocument: PDFDocumentProxy) {
        this.pdfDocument = pdfDocument;
    }

    pause() {
        this.isPlaying = false;
        this.options.isPlaying(this.isPlaying);
        Object.values(this.pageAudio).forEach((audio: any) => {
            audio.forEach((audioElement: PageAudio) => {
                audioElement.element.pause();
            });
        });
    }

    async play(page: number) {
        if (!this.pageAudio[page]) await this.generateAudio(page);
        this.startPlaying(page);
    }

    startPlaying(page: number) {
        if (this.isPlaying) return;
        if (!this.pageAudio[page]) return;

        this.isPlaying = true;
        this.options.isPlaying(this.isPlaying);

        const getAudioElements = (page: number) => Object.values(this.pageAudio[page]).map((audio: PageAudio) => audio.element);

        const playAudioChunksSequentially = (index: number = 0) => {
            const audioElements = getAudioElements(page);
            if (index >= audioElements.length) return;
            const audioEl = audioElements[index];
            if (!audioEl) return;
            audioEl.play();

            const endedHandler = () => {
                const audioElements = getAudioElements(page);

                if (index === audioElements.length - 1) {
                    this.play(page + 1);
                    audioEl.removeEventListener('ended', endedHandler);
                    this.options.onPlayNextPage(page + 1);
                    this.isPlaying = false;
                    this.options.isPlaying(this.isPlaying);
                    return;
                } else {
                    playAudioChunksSequentially(index + 1);
                }
            };
            audioEl.addEventListener('ended', endedHandler);
        };

        playAudioChunksSequentially(0);
    }

    async generateAudio(page: number) {
        this.options.isGeneratingAudio(true);
        return new Promise((resolve, reject) => {
            if (!this.pdfDocument) return reject(new Error('PDF document not found'));
            this.pdfDocument.getPage(page).then((pdfPage: PDFPageProxy) => {
                pdfPage.getTextContent().then((textContent: any) => {
                    let text = textContent.items.map((item: any) => item.str).join(' ');
                    this.pageAudio[page] = [];

                    // Split the text into smaller chunks
                    const maxChunkSize = 400;
                    const chunks = [];
                    let current = "";
                    let words = text.split(/\s+/);
                    for (let i = 0; i < words.length; i++) {
                        const word = words[i];
                        const next = current.length ? current + " " + word : word;
                        if (next.length > maxChunkSize) {
                            if (current.length > 0) {
                                chunks.push(current);
                                current = word;
                            } else {
                                chunks.push(word);
                                current = '';
                            }
                        } else {
                            current = next;
                        }
                    }
                    if (current.length > 0) chunks.push(current);
                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];

                        // Check for split words (e.g., "he- llo") and merge them
                        let sanitizedChunk = chunk.replace(/(\w+)-\s+(\w+)/g, '$1$2');

                        this.worker.postMessage({
                            page,
                            index: i,
                            chunks: chunks.length,
                            text: sanitizedChunk,
                            voice: 'af_heart',
                            type: 'generate',
                        });
                    }

                    const handleChunkComplete = (e: MessageEvent) => {
                        if (e.data.status === "complete") {
                            const { page, index, audio, chunks } = e.data;

                            if (!this.pageAudio[page]) this.pageAudio[page] = [];

                            const element = document.createElement('audio');
                            element.controls = true;
                            element.src = audio;
                            element.classList.add('hidden');
                            document.body.appendChild(element);

                            this.pageAudio[page][index] = { audio, element };
                            resolve(true);

                            if (index === chunks - 1) {
                                this.worker.removeEventListener("message", handleChunkComplete);
                            }
                        };
                    };

                    this.worker.addEventListener("message", handleChunkComplete);
                });
            });
        });
    }
}