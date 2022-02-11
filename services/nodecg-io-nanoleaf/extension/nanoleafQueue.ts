export class NanoleafQueue {
    private eventQueue: { functionCall: () => void; durationInSeconds: number }[] = [];
    private isQueueWorkerRunning = false;
    private isQueuePaused = false;

    queueEvent(functionCall: () => void, durationInSeconds: number): void {
        this.eventQueue.push({ functionCall, durationInSeconds });
        if (!this.isQueueWorkerRunning) {
            this.isQueueWorkerRunning = true;
            this.showNextQueueEffect();
        }
    }

    private showNextQueueEffect() {
        if (this.eventQueue.length >= 1) {
            if (!this.isQueuePaused) {
                const nextEffect = this.eventQueue.shift();
                nextEffect?.functionCall();
                setTimeout(() => this.showNextQueueEffect(), (nextEffect?.durationInSeconds || 1) * 1000);
            }
        } else {
            this.isQueueWorkerRunning = false;
        }
    }

    public pauseQueue(): void {
        this.isQueuePaused = true;
    }

    public resumeQueue(): void {
        if (this.isQueuePaused) {
            this.isQueuePaused = false;
            this.showNextQueueEffect();
        }
    }

    isEffectActive(): boolean {
        return this.isQueueWorkerRunning;
    }
}
