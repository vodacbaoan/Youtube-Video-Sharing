declare module '@rails/actioncable' {
  export type Subscription = {
    unsubscribe(): void
  }

  export type Consumer = {
    subscriptions: {
      create<T>(
        channel: string | Record<string, string>,
        callbacks: { received?(data: T): void },
      ): Subscription
    }
  }

  export function createConsumer(url?: string): Consumer
}
