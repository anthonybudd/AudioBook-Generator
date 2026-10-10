import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

interface AudioPlayerOptions {
    // isGeneratingAudio: (generating: boolean) => void;
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
    private pageAudio: { [page: number]: PageAudio[]; } = {};
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
                // console.log(audioElement);
                audioElement.element.pause();
            });
        });
    }

    async play(page: number) {
        if (!this.pageAudio[page]) await this.generateAudio(page);
        this.startPlaying(page);
    }

    startPlaying(page: number) {
        if (!this.pageAudio[page]) return;
        this.isPlaying = true;
        this.options.isPlaying(this.isPlaying);

        const audioElements = this.pageAudio[page].map((audio: PageAudio) => audio.element);

        const playAudioChunksSequentially = (audioElements: HTMLAudioElement[], index: number = 0) => {
            if (index >= audioElements.length) return;
            const audioEl = audioElements[index];
            if (!audioEl) return;
            audioEl.play();
            const endedHandler = () => {
                if (index === audioElements.length - 1) {
                    console.log('ended');
                    console.log(page + 1);
                    this.play(page + 1);
                    this.options.onPlayNextPage(page + 1);
                    return;
                }
            };
            audioEl.addEventListener('ended', endedHandler);
            audioEl.removeEventListener('ended', endedHandler);
            playAudioChunksSequentially(audioElements, index + 1);
        };

        playAudioChunksSequentially(audioElements);
    }

    async generateAudio(page: number) {
        return new Promise((resolve, reject) => {
            if (!this.pdfDocument) return reject(new Error('PDF document not found'));
            this.pdfDocument.getPage(page).then((pdfPage: PDFPageProxy) => {
                pdfPage.getTextContent().then((textContent: any) => {
                    let text = textContent.items.map((item: any) => item.str).join(' ');
                    console.log(text);

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
                        this.worker.postMessage({
                            page,
                            index: i,
                            chunks: chunks.length,
                            text: chunk,
                            voice: 'af_heart',
                            type: 'generate',
                        });
                    }

                    const handleChunkComplete = (e: MessageEvent) => {
                        if (e.data.status === "complete") {
                            const { page, index, audio, chunks } = e.data;

                            if (!this.pageAudio[page]) this.pageAudio[page] = [];

                            const audioEl = document.createElement('audio');
                            audioEl.controls = true;
                            audioEl.src = audio;
                            audioEl.classList.add('hidden');
                            document.body.appendChild(audioEl);

                            this.pageAudio[page][index] = {
                                audio,
                                element: audioEl,
                            };
                            resolve(true);
                            // this.options.isGeneratingAudio(false);
                            // this.startPlaying(page);

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