export interface UserCreatedEvent {
  eventId: string
  eventType: "user.created"
  userId: string
  clerkUserId: string
  email: string
  timestamp: string
}
