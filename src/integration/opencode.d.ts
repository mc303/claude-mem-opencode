declare module '@/bus' {
  export interface Bus {
    subscribe(event: string, handler: (...args: any[]) => void): void
    unsubscribe(event: string, handler: (...args: any[]) => void): void
    publish(event: string, ...args: any[]): void
  }

  export const Bus: Bus
}

declare module '@/session' {
  export interface SessionInfo {
    id: string
    contentSessionId: string
    directory: string
    title?: string
  }

  export interface Session {
    Event: {
      Created: string
      Updated: string
      Completed: string
    }
    Info: SessionInfo
    id: string
    contentSessionId: string
    currentPrompt: string
  }

  export interface MessagePartInfo {
    id: string
    sessionId: string
    toolName?: string
    toolInput?: any
    toolOutput?: string
  }

  export interface MessageV2 {
    Event: {
      Created: string
      PartUpdated: string
    }
    Part: MessagePartInfo
    id: string
    sessionId: string
    content: string
  }

  export const Session: Session
  export const MessageV2: MessageV2
}
